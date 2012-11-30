package models.commander

import akka.actor._
import play.api.libs.concurrent._

import play.api.libs.json._
import play.api.libs.functional.syntax._

import models.game._
import play.api.libs.concurrent.Execution.Implicits._

import play.api.libs.iteratee.Concurrent._

object Commander {

  val system = ActorSystem("BomberLand")
  val _game = system.actorOf(Props[Game], name = "game")
  var games = List(_game)

  implicit val coordFormat        = Json.format[Coord]
  implicit val deletePlayerFormat = Json.format[DeletePlayer]
  implicit val newPlayerFormat    = Json.format[NewPlayer]
  implicit val newDirectionFormat = Json.format[NewDirection]
  implicit val elementFormat      = Json.format[Element]

  implicit val boardWrites : Writes[Board] = new Writes[Board] {
    def writes(board:Board) = {
      Json.obj("elements" -> board.elements)
    }
  }

  def getGame (gameName : String) = {
    (games.filter(_.path.name.equals(gameName))) match {
       case head::tail => head
       case Nil => {
          val newGame = system.actorOf(Props[Game], name = gameName)
          games = games :+ newGame
          newGame
       }
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
          case Left(e)  => println("error "+e)
        }
    }
  }

  def cmd(userId: String, userCmd: Message, gameName : String) : Unit = {
    val game = getGame(gameName)
    userCmd match {
      case _:NewDirection =>  game ! ("broadcast" , userCmd)
      case _:NewPlayer    =>  game ! ("broadcast" , userCmd)
    }
  }

}

