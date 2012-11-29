package controllers

import play.api.Logger
import play.api._
import play.api.mvc._
import play.api.libs.json._
import play.api.libs.iteratee._
import play.api.libs.concurrent._
import scala.concurrent.ExecutionContext.Implicits._
import scala.util.Random

import models.commander.Commander

object Application extends Controller {
  val log = Logger(WebSocket.getClass())

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  def connect() = WebSocket.using[JsValue] { implicit request =>
    val userId = request.queryString.get("userId") match {
      case None     =>  Random.nextInt(10000).toString()
      case Some(x)  =>  x.head
    }

    val (out, channelClient) = Concurrent.broadcast[JsValue]
    log.info("New connection "+userId)
    Commander.createPlayer(userId, channelClient)

    val in = Iteratee.foreach[JsValue]{ userCmd =>
        log.info("Command from client "+userId+" : "+userCmd)
        Commander.cmd(userId, userCmd)
      }.mapDone { _ =>
        log.info(userId+" disconnected")
        Commander.killActor(userId)
    }

    (in, out)
  }

}
