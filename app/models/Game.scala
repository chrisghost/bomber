package server

import akka.actor._
import scala.concurrent.duration._

import play.api._
import play.api.libs.json._
import play.api.libs.iteratee._
import play.api.libs.concurrent._

import akka.util.Timeout
import akka.pattern.ask

import play.api.Play.current
import play.api.libs.concurrent.Execution.Implicits._

object Game {
  implicit val timeout = Timeout(1 second)

  lazy val default = {
    val gameActor = Akka.system.actorOf(Props[Game])
    gameActor
  }
  def join(username:String):scala.concurrent.Future[(Iteratee[JsValue,_],Enumerator[JsValue])] = {

    (default ? Join(username)).map {
      case Connected(enumerator) =>
        // Create an Iteratee to consume the feed
        val iteratee = Iteratee.foreach[JsValue] { event =>
          default ! Talk(username, (event \ "data").as[JsObject])
          }.mapDone { _ =>
            default ! Quit(username)
        }

        (iteratee,enumerator)
      case CannotConnect(error) =>
        // Connection error

        // A finished Iteratee sending EOF
        val iteratee = Done[JsValue,Unit]((),Input.EOF)

        // Send an error and close the socket
        val enumerator = Enumerator[JsValue](JsObject(Seq("error" -> JsString(error)))).andThen(Enumerator.enumInput(Input.EOF))
        (iteratee,enumerator)
     }
  }
}

class Game extends Actor {
  var members = Map.empty[String, PushEnumerator[JsValue]]

  def receive = {
    case Join(username) => {
      val channel = Enumerator.imperative[JsValue]( onStart = () => self ! NotifyJoin(username))
      if(members.contains(username)) {
        sender ! CannotConnect("This username is already used")
      } else {
        members = members + (username -> channel)
        sender ! Connected(channel)
      }
    }
    case NotifyJoin(username) => {
      notifyAll("join", username, JsObject(
        Seq("text" -> JsString("has entered the room")))
      )
    }

    case Talk(username, text) => {
      notifyAll("talk", username, text)
    }

    case Quit(username) => {
      members = members - username
      notifyAll("quit", username, JsObject(
        Seq("text"->JsString("has leaved the room")))
      )
    }
  }
  def notifyAll(kind: String, user: String, data: JsObject) {
      val msg = JsObject(
        Seq(
          "kind" -> JsString(kind),
          "user" -> JsString(user),
          "data" -> data,
          "members" -> JsArray(
            members.keySet.toList.map(JsString)
          )
        )
      )
      members.foreach {
        case (_, channel) => channel.push(msg)
      }
  }
}

case class Join(username: String)
case class Quit(username: String)
case class Talk(username: String, text: JsObject)
case class NotifyJoin(username: String)

case class Connected(enumerator:Enumerator[JsValue])
case class CannotConnect(msg: String)

/*
case class Game()

package message {
  package client {
    case class Command(code: String)

    case class Enter(slot: Slot)

    case class NotifyLeave(slot: Slot)
    case class NotifyName(slot: Slot, name: String)
    case class NotifyNames(names: Map[Slot, String])

    case class Tick(count: Int, code: String)
  }
  package slots {
    case class Register(instance: Instance, client: Client, player: Boolean)
    case class Unregister(slot: Slot)
  }
}


class Instance(val name: String) extends Actor with ActorLogging {
  def recieve() = {
    case _ => log.info(_)
  }
  def clientEnter(client: Client, player: Boolean) {
    client.slots ! message.slots.Register(this, client, player)
  }
}
class Client(instance: Instance, player: Boolean) extends Actor {
  protected var slot: Slot = Slot.none
  def slots: Slots
  val out = Enumerator.imperative[String](onStart = instance.clientEnter(this, player))
  start()

  def act() {
    import message.client._
    loop {
      react {
        case Command(code) => command(code)
        case Enter(slot, area) => enter(slot, area)

        case NotifyLeave(slots) => notifyLeave(slots)
        case NotifyName(slot, name) => notifyName(slot, name)
        case NotifyNames(names) => notifyNames(names)

        case Tick(count, code) => tick(count, code)
        case 'stop => { stop(); exit }
        }
      }
    }

  def command(code: String) {}

  def enter(slot: Slot) { this.slot = slot }

  def notifyLeave(slot: Slot) {}
  def notifyName(slot: Slot, name: String) {}
  def notifyNames(names: Map[Slot, String]) {}

  def tick(tickCount: Int, code: String) {}

  def stop() {
    instance.clientLeave(this)
  }
  }
class Slots(allocable: Slot.Range) extends Actor {
  private val registered = scala.collection.mutable.Set[Slot]()
  private val rand = new Random()

  start()

  private def allocSlot(entities: Seq[Slot]): Slot = {
    val freeSlots = (allocable.slots -- registered -- entities).toSeq
    if (freeSlots.isEmpty) Slot.none
    else {
      val slot = freeSlots(rand.nextInt(freeSlots.size))
      registered += slot
      slot
    }
  }

  def act() {
    loop {
      react {
        case _ => log.info(_.toString())
        }
      }
    }
  }
*/
