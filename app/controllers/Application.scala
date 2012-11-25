package controllers

import play.api._
import play.api.mvc._
import play.api.libs.json._
import play.api.libs.iteratee._
import play.api.libs.concurrent._

import server._

//import server._

object Application extends Controller {

  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  def stream(username: String) = WebSocket.async[JsValue] { request =>
    Game.join(username)
  }
}
