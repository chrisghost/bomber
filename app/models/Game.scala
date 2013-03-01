package models.game

import akka.actor._
import play.api.libs.iteratee.Concurrent._
import play.api.libs.json._
import play.Logger
import scala.util.Random
import collection.mutable.MutableList

class Game extends Actor {
  private var members = Map.empty[String, PlayerInfos]
  private val bomberStyles = List("classic", "punk", "robot", "miner")
  private var board : List[Element] = List.empty
  private var geneMap : List[GeneSlot] =
    (for (a <- 0 until 10; b <- 0 until 10) yield(a,b)).map {
      case (x,y) => GeneSlot(Coord(x*10, y*10), Coord(x,y), false)
    }.toList

  def receive = {
    case StrMsg("init") => initBoard
    case m: NewDirection => {
      broadcastBut(m.userId, m)
      (members get m.userId).get.position = m.position
    }
    case ("createPlayer", uId: String, channel: Channel[JsValue]) => createPlayer(uId, channel)
    case ("deletePlayer", userId:String) => {
      if(members contains userId) {
        context.stop((members get userId).get.actor)
        members -= userId
        broadcast(DeletePlayer(userId))
        if(members.isEmpty) {
          terminateGame
        }
      }
    }
    case bomb: Bomb => broadcast(bomb)
    case ready: Ready => {
      (members get ready.userId).get match {
        case p: PlayerInfos => p.ready = ready.ready
        case _ => Logger.error("Did not find specified user")
      }
      broadcast(getReadyList)
    }
    case destroy:Destroy => {
      val mPos = Coord(destroy.coord.x/30, destroy.coord.y/30)

      val aim = board.find(el => (el.coord.x == mPos.x && el.coord.y == mPos.y)).get

      val nKind = aim.kind match {
        case boardElem.CRATE => boardElem.GROUND
        case boardElem.C_BOMB => boardElem.B_BOMB
        case boardElem.C_FLAME => boardElem.B_FLAME
        case boardElem.C_SPEED => boardElem.B_SPEED
        case _ => boardElem.GROUND
      }

      board = board.filterNot(x => (x.coord.x == mPos.x && x.coord.y == mPos.y)):+Element(aim.coord, nKind)
      broadcastBut(destroy.userId, destroy)
    }
    case death: Death => {
      val userId = death.userId

      (members get userId).get.alive = false
      broadcast(death)

      val aliveMembers = members.filter(m => true == m._2.alive)
      if (1 == aliveMembers.size) {
        broadcast(new GotWinner(aliveMembers.head._2.userId))
        terminateGame
      }
    }

    case HowManyPlayer => sender ! members.size
  }

  def terminateGame = {
    models.commander.Commander.deleteGame(self)
    Logger.info("Game "+self.path.name+" is over")
    context.stop(self)
  }

  def getReadyList = {
    ReadyList(members.map(v => Ready(v._1, v._2.ready)).toList)
  }

  def createPlayer(userId: String, out: Channel[JsValue]) = {
    if(!members.contains(userId)) {

      val p_actor = context.actorOf(Props(new Player(out)), name="act_"+userId)

      val pPos = if(members.size >= geneMap.count(x => x.gene)) addChunk else Coord(150,150)

      members = members + (userId -> (new PlayerInfos(userId, bomberStyles(Random.nextInt(4)), p_actor, pPos, false, true)))


      broadcast(NewPlayer(userId, (members get userId).get.style))
      broadcast(Position(userId, (members get userId).get.position))
      sendPlayersList(userId)
      broadcast(getReadyList)
      broadcast(Board(board.toList))

    }
  }

  def initBoard = {
    println("initializing board")
    board = generateBoard(0,0,10,10)
    makeWall(0,0,10,0)
    makeWall(0,0,0,10)
    makeWall(0,10,10,10)
    makeWall(10,0,10,10)
    geneMap = geneMap.filterNot(x => (x.coord == Coord(0,0))):+GeneSlot(Coord(0,0), Coord(0,0), true)
  }

  def generateBoard(x:Int, y:Int, w:Int, h:Int) = {
    val xr = x until x+w
    val yr = y until y+h

    val centerX = x+Math.floor(w/2);
    val centerY = y+Math.floor(h/2);

    (for (a <- xr; b <- yr) yield(a,b)).map {
      v => v match {
        //case (0,y)             => Element(Coord(0,y), boardElem.WALL) // LEFT WALL
        //case (x,0)            => Element(Coord(x,0), boardElem.WALL) // TOP WALL
        //case (x,y) if(y==h-1) => Element(Coord(x,y), boardElem.WALL) // BOTTOM WALL
        //case (x,y) if(x==w-1) => Element(Coord(x,y), boardElem.WALL) // RIGHT WALL
        case (x,y) => (x,y) match {
          case (x,y) if(x%2==0 && y%2==0)
              => Element(Coord(x,y), boardElem.WALL)
          //case (x,y) if(!((x == 1 || x == 2) && (y == 1 || y == 2)) &&      // TOP-LEFT PLAYER SPAWN ZONE
                        //!((x == w-2 || x == w-3) && (y == 1 || y == 2)) &&  // TOP-RIGHT PLAYER SPAWN ZONE
                        //!((x == 1 || x == 2) && (y == h-2 || y == h-3)) &&  // BOTTOM-LEFT PLAYER SPAWN ZONE
                        //!((x == w-2 || x == w-3) && (y == h-2 || y == h-3)) // BOTTOM-RIGHT PLAYER SPAWN ZONE
                        //) => Element(Coord(x,y), genCrate)
          case (x,y) if(!(x >= centerX-1 && x <= centerX+1 &&
                          y >= centerY-1 && y <= centerY+1)) =>
                        Element(Coord(x,y), genCrate)
          case _ => Element(Coord(x,y), boardElem.GROUND)
        }
      }
    }.toList
  }

  def addChunk:Coord = {
    val geneP = geneMap.find(x => !x.gene).get
    //println("GENERATING................",geneP)
    board = board ::: generateBoard(geneP.coord.x, geneP.coord.y, 11, 11)

    geneMap = geneMap.filterNot(x => (x.coord == geneP.coord)):+GeneSlot(geneP.coord, geneP.gCoord, true)

    geneMap.find(el => el.gCoord.x == geneP.gCoord.x-1 && el.gCoord.y == geneP.gCoord.y).map {
      case el : GeneSlot => if(!el.gene) makeWall(geneP.coord.x, geneP.coord.y,geneP.coord.x,geneP.coord.y+10)
    }


    val left = geneMap.find(el => el.gCoord.x == geneP.gCoord.x-1 && el.gCoord.y == geneP.gCoord.y).map(_.gene).getOrElse(false) 
    val right = geneMap.find(el => el.gCoord.x == geneP.gCoord.x+1 && el.gCoord.y == geneP.gCoord.y).map(_.gene).getOrElse(false)

    val up = geneMap.find(el => el.gCoord.x == geneP.gCoord.x && el.gCoord.y == geneP.gCoord.y-1).map(_.gene).getOrElse(false)

    val down = geneMap.find(el => el.gCoord.x == geneP.gCoord.x && el.gCoord.y == geneP.gCoord.y+1).map(_.gene).getOrElse(false)


    if (!left) makeWall(geneP.coord.x, geneP.coord.y,geneP.coord.x,geneP.coord.y+10)

    if(!right) makeWall(geneP.coord.x+10, geneP.coord.y,geneP.coord.x+10,geneP.coord.y+10)

    if(!up) makeWall(geneP.coord.x, geneP.coord.y,geneP.coord.x+10,geneP.coord.y)

    if(!down) makeWall(geneP.coord.x, geneP.coord.y+10,geneP.coord.x+10,geneP.coord.y+10)

    Coord((geneP.coord.x+5)*30, (geneP.coord.y+5)*30)

  }


  def makeWall(x:Int,y:Int,toX:Int,toY:Int) {
    val xr = x until toX+1
    val yr = y until toY+1

    //println("MakeWall",xr,yr)

    (for (a <- xr; b <- yr) yield(a,b)).map {
      case (x,y) => {
        board = board.filterNot(x => (x.coord.x == x && x.coord.y == y)):+Element(Coord(x,y), boardElem.WALL)
      }
    }
  }

  def wallToDotted(x:Int,y:Int,toX:Int,toY:Int) {
    // From [Wall][Wall][Wall]
    // To   [Wall][    ][Wall]

    val xr = x until toX+1
    val yr = y until toY+1

    (for (a <- xr; b <- yr) yield(a,b)).map {
      case (x,y) if(!(x%2==0 && y%2==0)) => board = board.filterNot(x => (x.coord.x == x && x.coord.y == y)):+Element(Coord(x,y), boardElem.GROUND)
      case _ =>
    }
  }

  def genCrate = Math.random() match {
    case v:Double if(v<0.2)  => boardElem.C_BOMB
    case v:Double if(v<0.4)  => boardElem.C_SPEED
    case v:Double if(v<0.6)  => boardElem.C_FLAME
    case v:Double            => boardElem.CRATE
    }

  def sendPlayersList(receiver:String) = {
    members filterKeys (_!=receiver) foreach {
      v => {
        (members get receiver).get.actor ! NewPlayer(v._2.userId, v._2.style)
        (members get receiver).get.actor ! Position(v._2.userId, v._2.position)
      }
    }
  }

  def sendTo(userId: String, msg: Message) {
    members.filter(v => v._1 == userId).foreach(v => v._2.actor ! msg)
  }

  def broadcast(msg: Message) {
    members.foreach(v => v._2.actor ! msg )
  }

  def broadcastBut(userId: String, msg: Message) {
    members.filter(v => v._1 != userId).foreach(v => v._2.actor ! msg )
  }
}

class PlayerInfos(val userId:String, val style:String, val actor:ActorRef, var position:Coord, var ready: Boolean, var alive: Boolean)

class Player(out: Channel[JsValue]) extends Actor {
  import models.commander.Commander._
  def receive = {
    case msg:Message => {
      msg match {
        case nd : NewDirection =>
          out.push(
            Json.obj(
              "kind"-> "newDirection",
              "c"   -> Json.toJson(nd)
            )
          )
        case np : NewPlayer =>
          out.push(
            Json.obj(
              "kind"-> "newPlayer",
              "c"   ->  Json.toJson(np)
            )
          )
        case pos : Position =>
          out.push(
            Json.obj(
              "kind"-> "position",
              "c"   ->  Json.obj(
                "userId"  ->  pos.userId,
                "x"       ->  pos.pos.x,
                "y"       ->  pos.pos.y
                )
            )
          )
        case dp : DeletePlayer =>
          out.push(
            Json.obj(
              "kind"  -> "deletePlayer",
              "c"     ->  Json.toJson(dp)
            )
          )
        case bo : Board =>
          out.push(
            Json.obj(
              "kind"  -> "board",
              "c"     ->  Json.toJson(bo)
            )
          )
        case bomb : Bomb =>
          out.push(
            Json.obj(
              "kind"  -> "bomb",
              "c"     ->  Json.toJson(bomb)
            )
          )
        case readyList : ReadyList =>
          out.push(
            Json.obj(
              "kind"  -> "readyList",
              "c"     ->  Json.toJson(readyList)
            )
          )
        case death: Death =>
          out.push(Json.obj(
            "kind"  -> "death",
            "c"     ->  Json.toJson(death)
          ))
        case gotWinner : GotWinner =>
          out.push(Json.obj(
            "kind"  -> "gotwinner",
            "c"     ->  Json.toJson(gotWinner)
          ))
        case destroy : Destroy =>
          out.push(
            Json.obj(
              "kind"  -> "destroy",
              "c"     ->  Json.toJson(destroy)
            )
          )
      }
    }
  }
}

abstract class Message
case class StrMsg(msg:String) extends Message
case class NewDirection(userId:String, x:Int, y:Int, position:Coord) extends Message
case class NewPlayer(userId:String, style:String) extends Message
case class Position(userId:String, pos:Coord) extends Message
case class DeletePlayer(userId:String) extends Message
case class Bomb(userId:String, name:String, x:Int, y:Int, flameSize:Int, flameTime:Int) extends Message
case class Ready(userId: String, ready: Boolean) extends Message
case class ReadyList(readyList: List[Ready]) extends Message
case class Death(userId: String) extends Message
case class GotWinner(winner: String) extends Message
case object HowManyPlayer extends Message

case class Coord(x:Int, y:Int)
case class GeneSlot(coord:Coord, gCoord:Coord, gene:Boolean)
case class Element(coord:Coord, kind:Int)
case class Board(elements:List[Element]) extends Message

case class Destroy(userId:String, coord:Coord) extends Message

object boardElem {
  val GROUND  = 0
  val WALL    = 1
  val CRATE   = 2     // CRATE WITH NO BONUS
  val C_BOMB  = 21    // CRATE WITH BOMB BONUS
  val C_SPEED  = 22   // CRATE WITH SPEED BONUS
  val C_FLAME = 23    // CRATE WITH FLAME BONUS
  val B_BOMB  = 31
  val B_SPEED  = 32
  val B_FLAME = 33
}
