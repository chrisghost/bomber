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

  def bomber(game:String, player:String) = Action {
    Ok(views.html.bomber(game, player))
  }

  def gamesList = Action {
    Ok(Commander.getGamesList)
  }

  def connect(gameName:String, userId:String) = WebSocket.using[JsValue] { implicit request =>

    val (out, channelClient) = Concurrent.broadcast[JsValue]
    log.info("New connection "+userId)
    Commander.createPlayer(userId, channelClient, gameName)

    val in = Iteratee.foreach[JsValue]{ userCmd =>
        log.info("Command from client "+userId+" : "+userCmd)
        Commander.cmd(userId, userCmd, gameName)
      }.mapDone { _ =>
        log.info(userId+" disconnected")
        Commander.killActor(userId, gameName)
    }

    (in, out)
  }

}
