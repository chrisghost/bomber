package server

import akka.actor._
import scala.concurrent.duration._

import play.api._
import play.api.libs.iteratee._
import play.api.libs.concurrent._
import play.api.mvc.RequestHeader

import play.api.libs.json._
import play.api.libs.json.util._
import play.api.libs.json.Format._


import akka.util.Timeout
import akka.pattern.ask

import play.api.Play.current
import play.api.libs.concurrent.Execution.Implicits._



object Commander {

  val system = ActorSystem("BomberLand")
  val _game = system.actorOf(Props[Game], name = "game")

  def createPlayer(userId: String, out: Concurrent.Channel[JsValue]) = {
    _game ! ("createPlayer", userId, out)
  }
  def killActor(userId:String) {
    _game ! ("deletePlayer", userId)
  }

  implicit object cmdFormat extends Format[Command] {
    def writes(o: Command):JsValue = JsObject (
      List("kind" -> JsString(o.kind), "c" -> JsString(o.c))
    )
    def reads(json: JsValue): JsResult[Command] = JsSuccess(Command(
      (json \ "kind").as[String],
      (json \ "c").as[String]
    ))
  }
  def cmd(userId: String, userCom: JsValue) : Unit = {
        println(userCom)
    val c = Json.fromJson[Command](userCom).asEither match {
      case Right(c) => {
        cmd(userId,c)
      }
      case Left(e) =>
        println("error", e)
    }
  }

  def cmd(userId: String, userCmd: Command) : Unit = {
    userCmd.kind match {
      case "talk" => {
        println("talk")
      }
      case "dir" => {
        _game ! ("broadcast" , userCmd)
      }
    }
  }
}

class Game extends Actor {
  private var members = Map.empty[String, ActorRef]
  def receive = {
    case ("broadcast", msg:Command) => broadcast(msg)
    case ("createPlayer", uId:String, channel:Concurrent.Channel[JsValue]) => createPlayer(uId, channel)
    case ("deletePlayer", userId:String) => {
      context.stop(members.get(userId).get)
      members -= userId
    }
  }

  def createPlayer(userId: String, out: Concurrent.Channel[JsValue]) = {
    val p_actor = context.actorOf(Props(new Player(userId, out)), name="player"+userId)
    members = members + (userId -> p_actor)
    p_actor ! Command("broadcast", "daz")
    println("createplayer")
    p_actor
  }

  def broadcast(msg: Command) {
    println("broadcasting....", msg)
    //context.actorSelection("../*") ! msg
    members.foreach {
      case (s:String, act:ActorRef) => {
        act ! ("broadcast", msg)
      }
    }
  }
}

class Player(userId: String, out: Concurrent.Channel[JsValue]) extends Actor {
  import server.Commander.cmdFormat
  def receive = {
    case ("broadcast", msg:Command) => {
      out.push(Json.toJson(msg))
      println("...done ....",Json.toJson(msg))
    }
  }
}

case class Command(kind:String, c:String)

