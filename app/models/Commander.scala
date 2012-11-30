package models.commander

import akka.actor._
import play.api.libs.concurrent._

import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.libs.json.util._
import play.api.libs.json.Format._
import play.api.libs.json.Reads._
import play.api.libs.json.Writes._

import models.game._
import play.api.libs.concurrent.Execution.Implicits._
//import scala.concurrent.Channel

import play.api.libs.iteratee.Concurrent._

object Commander {

  val system = ActorSystem("BomberLand")
  val _game = system.actorOf(Props[Game], name = "game")

  implicit val coordFormat = Json.format[Coord]
  implicit val deletePlayerFormat  = Json.format[DeletePlayer]
  implicit val newPlayerFormat = Json.format[NewPlayer]
  implicit val newDirectionFormat = Json.format[NewDirection]

  def createPlayer(userId: String, out: Channel[JsValue]) = {
    _game ! ("createPlayer", userId, out)
  }
  def killActor(userId:String) {
    _game ! ("deletePlayer", userId)
  }

  def cmd(userId: String, userCom: JsValue) : Unit = {
    userCom \ "kind" match {
      case JsString("newDirection") =>
        (userCom \ "data").validate(newDirectionFormat).asEither match {
          case Right(c) => cmd(userId, c)
          case Left(e)  => println("error "+e)
        }
    }
  }

  def cmd(userId: String, userCmd: Message) : Unit = {
    userCmd match {
      case _:NewDirection =>  _game ! ("broadcast" , userCmd)
      case _:NewPlayer    =>  _game ! ("broadcast" , userCmd)
    }
  }

}

