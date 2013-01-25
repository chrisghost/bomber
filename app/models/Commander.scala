package models.commander

import akka.actor._
import models.game._
import play.api.libs.concurrent.Execution.Implicits._
import play.api.libs.functional.syntax._
import play.api.libs.iteratee.Concurrent._
import play.api.libs.json._
import play.Logger

object Commander {

  val system = ActorSystem("BomberLand")
  val _game = system.actorOf(Props[Game], name = "game")
  var games : List[ActorRef] = List(_game)

  implicit val coordFormat        = Json.format[Coord]
  implicit val deletePlayerFormat = Json.format[DeletePlayer]
  implicit val newPlayerFormat    = Json.format[NewPlayer]
  implicit val newDirectionFormat = Json.format[NewDirection]
  implicit val elementFormat      = Json.format[Element]
  implicit val bombFormat         = Json.format[Bomb]
  implicit val readyFormat        = Json.format[Ready]
  implicit val destroyFormat      = Json.format[Destroy]
  implicit val deathFormat        = Json.format[Death]

  implicit val readyListFormat : Writes[ReadyList] = new Writes[ReadyList] {
    def writes(readyList: ReadyList) = {
      Json.obj("readyList" -> readyList.readyList)
    }
  }

  implicit val boardWrites : Writes[Board] = new Writes[Board] {
    def writes(board:Board) = {
      Json.obj("elements" -> board.elements)
    }
  }

  def getGamesList : JsValue = {
    Json.toJson(games.map{ x => x.path.name})
  }

  def deleteGame(actor: ActorRef) = {
    games = games.filterNot(_ == actor)
  }

  def getGame (gameName : String) = {
    games.find(_.path.name == gameName) match {
      case None =>
        val newGame = system.actorOf(Props[Game], name = gameName)
        games = games :+ newGame
        newGame
      case Some(game) =>
        game
    }
  }

  def createPlayer(userId: String, out: Channel[JsValue], gameName: String) = {
    getGame(gameName) ! ("createPlayer", userId, out)
  }
  def killActor(userId:String, gameName: String) {
    getGame(gameName) ! ("deletePlayer", userId)
  }

  def cmd(userId: String, userCom: JsValue, gameName: String) : Unit = {
    userCom \ "kind" match {
      case JsString("newDirection") =>
        (userCom \ "data").validate(newDirectionFormat).asEither match {
          case Right(c) => cmd(userId, c, gameName)
          case Left(e)  => Logger.error("Unable to parse data ("+(userCom \ "data") +"), got error : "+e)
        }
      case JsString("bomb") =>
        (userCom \ "data").validate(bombFormat).asEither match {
          case Right(c) => cmd(userId, c, gameName)
          case Left(e)  => Logger.error("Unable to parse data ("+(userCom \ "data") +"), got error : "+e)
        }
      case JsString("ready") =>
        (userCom \ "data").validate(readyFormat).asEither match {
          case Right(c) => cmd(userId, c, gameName)
          case Left(e)  => Logger.error("Unable to parse data ("+(userCom \ "data") +"), got error : "+e)
        }
      case JsString("destroy") =>
        (userCom \ "data").validate(destroyFormat).asEither match {
          case Right(c) => cmd(userId, c, gameName)
          case Left(e)  => Logger.error("Unable to parse data ("+(userCom \ "data") +"), got error : "+e)
        }
      case JsString("death") =>
        (userCom \ "data").validate(deathFormat).asEither match {
          case Right(c) => cmd(userId, c, gameName)
          case Left(e)  => Logger.error("Unable to parse data ("+(userCom \ "data") +"), got error : "+e)
        }
    }
  }

  def cmd(userId: String, userCmd: Message, gameName : String) : Unit = {
    val game = getGame(gameName)
    userCmd match {
      case _:NewDirection =>  game ! userCmd
      case _:NewPlayer    =>  game ! ("broadcast" , userCmd)
      case _:Bomb         =>  game ! userCmd
      case _:Ready        =>  game ! userCmd
      case _:Destroy      =>  game ! userCmd
      case _:Death        =>  game ! userCmd
    }
  }

}

