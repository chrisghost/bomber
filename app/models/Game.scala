package models.game

import akka.actor._
import scala.concurrent.duration._

import play.api._
import play.api.libs.iteratee._
import play.api.libs.iteratee.Concurrent._
import play.api.libs.concurrent._
import play.api.mvc.RequestHeader

import play.api.libs.json._

import akka.util.Timeout
import akka.pattern.ask

import scala.util.Random

import play.api.Play.current

class Game extends Actor {
  private var members = Map.empty[String, PlayerInfos]
  private val bomberStyles = List("classic", "punk", "robot", "miner")
  private val playerPositions = List(Coord(0,0), Coord(270,0), Coord(0,270), Coord(270,270))

  def receive = {
    case ("broadcast", msg:Message) => broadcast(msg)
    case m:NewDirection => broadcast(m)
    case ("createPlayer", uId:String, channel:Channel[JsValue]) => createPlayer(uId, channel)
    case ("deletePlayer", userId:String) => {
      if(members contains userId) {
        context.stop((members get userId).get.actor)
        members -= userId
      }
    }
  }

  def createPlayer(userId: String, out: Channel[JsValue]) = {
    val p_actor = context.actorOf(Props(new Player(out)), name="act_"+userId)

    members = members + (userId -> PlayerInfos(userId, bomberStyles(Random.nextInt(4)), p_actor))
    broadcast(NewPlayer(userId, (members get userId).get.style))
    broadcast(Position(userId, nextPlayerPosition))
    sendPlayersList(userId)
  }

  def sendPlayersList(receiver:String) = {
    members filterKeys (_!=receiver) foreach {
      v => (members get receiver).get.actor ! NewPlayer(v._2.userId, v._2.style)
    }
  }

  def nextPlayerPosition = {
    playerPositions(members.size-1)
  }

  def broadcast(msg: Message) {
    members.foreach(v => v._2.actor ! msg )
  }
}

case class PlayerInfos(userId:String, style:String, actor:ActorRef)

class Player(out: Channel[JsValue]) extends Actor {
  import models.commander.Commander._
  def receive = {
    case msg:Message => {
      msg match {
        case nd : NewDirection  =>
          out.push(
            Json.obj(
              "kind"-> "newDirection",
              "c"   -> Json.toJson(nd)
            )
          )
        case np : NewPlayer     =>
          out.push(
            Json.obj(
              "kind"-> "newPlayer",
              "c"   ->  Json.toJson(np)
            )
          )
        case pos : Position     =>
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
      }
    }
  }
}

abstract class Message
case class NewDirection(userId:String, x:Int, y:Int) extends Message
case class NewPlayer(userId:String, style:String) extends Message
case class Position(userId:String, pos:Coord) extends Message

case class Coord(x:Int, y:Int)

