package controllers

import play.api.Logger
import play.api._
import play.api.mvc._
import play.api.libs.json._
import play.api.libs.iteratee._
import play.api.libs.concurrent._
import scala.concurrent.ExecutionContext.Implicits._
import scala.util.Random

import server._

object Application extends Controller {
  val log = Logger(WebSocket.getClass())

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  def connect() = WebSocket.using[JsValue] { implicit request =>
    val userId = request.session.get("pid").getOrElse(
      "invite"+Random.nextInt()
    )
    val (out, channelClient) = Concurrent.broadcast[JsValue]
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
