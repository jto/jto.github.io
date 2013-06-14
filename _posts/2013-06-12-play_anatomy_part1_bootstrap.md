---
layout: post
title: 'Play, Anatomy of a web framework: The Web Server.'
tags: playframework, scala
summary: In this series of article, I'll explain the internals of playframework. I'll try to show how play works, from starting an application to rendering the HTTP response. Today, I will cover the startup of a play application in "prod" mode. We'll also see how play listens to HTTP requests, parse them and call your application code.
image: http://www.playframework.com/assets/images/logos/normal.png
---

<header>
In this series of article, I'll explain the internals of [playframework](http://www.playframework.com/ "play"). I'll try to show how play works, from starting an application to rendering the HTTP response. Today, I will cover the startup of a play application in "prod" mode. We'll also see how play listens to HTTP requests, parse them and call your application code.
</header>

## General philosophy
Since you're reading this, you're probably already familiar with the framework, but here is a reminder of the things you absolutely need to know:

- Play is stateless. As far as the framework is concerned, nothing gets stored on the server between requests. Of course a typical web app has some sort of persistence engine (SQL, NoSQL, files etc.), but that's not part of the framework. Stateless is opposed to stateful (thank you captain obvious!), where the framework keeps data about the user between request.
<span class="note">
  Play has something called a session, but it's actually just a cookie, which explains why you can only store Strings in there.
</span>

- Play is __reactive__. Behind the buzzword, it means play will use as few threads as possible, and therefore, threads are "shared" between clients. That's very important for long lived connections like Server Sent Events, or Websockets. A typical JEE application is giving a thread to each HTTP connection (at least until JSR 315: Servlet 3.0), play does not. It has *HUGE* impacts on both the framework design and the way you're supposed to use it (especially the things you're NOT supposed to do).

- Version 2 is a complete rewrite, and a completely different beast. The (java) user API is meant to feel familiar to a play 1 user thought.

- Much more focus is put on type safety, which should not come as a surprise since play is backed by a company called [Typesafe](http://typesafe.com/).

- The internals are designed in a mix of functional programming and object orientation. Most of it is written in Scala, and the framework has a Java "translation" layer on top of it. Generally, the code is fairly simple, and you don't need to be a Scala expert to understand what's going on. It avoids mutable states as much as possible (Which is preferred in Scala).

- It's open source! Hopefully you'll find everything you need to know to contribute here. The community is waiting for your [pull requests](https://github.com/playframework/Play20). Contributions to the docs or bugfixes are always welcome.

## Let's get started!

![play](http://www.playframework.com/assets/images/logos/normal.png "play")

### Launching a play app

So, you typed `play start`, what happened ?

Well actually, You've just called [sbt](http://www.scala-sbt.org/), the default Scala Build Tool _(yes, 'S' stands for Scala __not__ for Simple)_ with a bunch of specific parameters.

Sbt "reads" your application build definition, and finds out that it's using a plugin called `play % sbt-plugin`.
You can see it in `project/plugins.sbt` ( [here](https://github.com/playframework/Play20/blob/master/samples/scala/helloworld/project/plugins.sbt#L8) in the HelloWorld sample).

This plugin has a config key telling sbt where the entry point (the main) of the application is. I won't cover sbt here (play build alone could use a pretty big article), but it says [here]( https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlaySettings.scala#L120) that main lives in `play.core.server.NettyServer`

In play, and contrary to standard JEE, there's no "application server" hosting applications. The application you've created using `play new` just __is__ the server, and Play is just one of it's dependencies (precisely, several dependencies since play is split in modules).

As you guessed, Play is simply currently based on the very famous (and java based) [Netty](http://netty.io/). Sbt will look into [this object](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/server/NettyServer.scala#L268-L275) to find a main. You probably noticed a method called `mainDev`, obviously this one is called in dev mode (when you use `play run`). We'll just focus on `main` for now.

As you can tell reading the code, it just parses the arguments, creates a file containing the PID (in case you want to stop the app at some point), and does some other boring initialization boilerplate. Let's skip it to the interesting bits:

<script src="https://gist.github.com/jto/5636921.js"></script>

Ah! There it is. Eventually a `new NettyServer` is created with a bunch of arguments. But first, since scala is not lazy, it's evaluates `new StaticApplication(applicationPath)`.

### Bootstrap

First thing first, a Play application needs to be initialized. Let's have a look at that [`StaticApplication`](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/system/ApplicationProvider.scala). "Why is it called a Static application?" you may ask. Simply because it won't hot redeploy code changes (We're in prod mode remember? Sensible people don't hot redeploy in production).

So we get [there](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/system/ApplicationProvider.scala#L48-L56). We create a `DefaultApplication`, which is basically just a case class containing general info about the current app, like app folder, configuration, classloader, etc. (code [here](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/api/Application.scala#L395-L399)), and we call [`Play.start(application)`](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/api/Play.scala#L60-L76).

What it's going to do is fairly simple:

<script src="https://gist.github.com/jto/5637043.js"></script>

Just call `onStart` on each plugin, one by one, making sure they're using the correct classloader.
Those plugins will, for example, create a connection pools to a DB.

<span class="note">
  At that point, if a plugin throws an exception, the application will just be stopped.
</span>

So we know the application configuration, we have started our plugins successfully. We're now ready to start listening for HTTP requests.

### Listening for Http Requests.

It's now time to create a `NettyServer`. As we've seen, we create an instance of the [`NettyServer`](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/server/NettyServer.scala) class (not to be confused with the `NettyServer` object).

This class will create an instance of `Server`, configuring it's [threads pools](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/server/NettyServer.scala#L43-L44), the pipeline [encoder](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/server/NettyServer.scala#L57) and [decoder](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/server/NettyServer.scala#L58), bind the server to an [adress and port](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/server/NettyServer.scala#L131), configure [SSL](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/server/NettyServer.scala#L65-L119), but more importantly this: `newPipeline.addLast("handler", defaultUpStreamHandler)` which is:

<script src="https://gist.github.com/jto/5636790.js"></script>

So each time an HTTP or HTTPS request is received, Netty will call `messageReceived` of this instance of [`PlayDefaultUpstreamHandler`](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/server/netty/PlayDefaultUpstreamHandler.scala).

This method does a few things:

- It create play a `play.api.mvc.RequestHeader` from Netty's HttpRequest. Basically filling it with headers values, parsing the query string, etc. But it does __NOT__ try to parse the request body (not yet).
- It manages the flash cookie, making sure it only lives for 1 request.
- It can "tag" the request, adding metadata in the request object about routing.
- It uses the application [`Global`](http://www.playframework.com/documentation/2.1.1/ScalaGlobal) object to find out what to do with this request:
<script src="https://gist.github.com/jto/5638714.js"></script>
What it does here is handling exceptions un parameters parsing. If something fail,
`onBadRequest(rh, e.getMessage)` is called on the application `Global` object (if no global is provided, it's using the default Global) which should render an Error page with status 500. Otherwise, it calls `server.getHandlerFor(rh)` which return `Either[Result, (Handler, Application)]`.

`getHandlerFor` is there to resolve the [`Handler`](http://www.playframework.com/documentation/api/2.1.1/scala/index.html#play.api.mvc.Handler) to be called.
The two main types of Handlers are:

- EssentialAction: Basically that's what you defined in your Controllers by writing `Action { request => ... }`
- WebSocket

<script src="https://gist.github.com/jto/5644008.js"></script>

All this code does is finding the `Handler` to be invoked by calling `Global.onRouteRequest` OR it returns the appropriate Response if an error occurred. If something failed, it will return a `Left` containing a Response (for example a HTML page with status 500), otherwise it returns a `Right` containing the Handler defined in your app (for example, an Action defined in a controller).

#### Dealing with the request body

Alright. So far we've somehow discovered the code that needs to be called. You may have noticed that we are only working with a `RequestHeader`, that's a request without a body. Using pattern matching, we'll decide what to do with the value returned by `getHandlerFor`.

The most common case by far is `EssentialAction`:

<script src="https://gist.github.com/jto/5644133.js"></script>

Fundamentally, an [`EssentialAction`](http://www.playframework.com/documentation/api/2.1.1/scala/index.html#play.api.mvc.EssentialAction) is just a function `(RequestHeader) => Iteratee[Array[Byte], Result]`.
You give that function a `RequestHeader` and it gives you an [`Iteratee`](http://www.playframework.com/documentation/2.1.1/Iteratees) that consumes the request body reactively, and eventually "returns" a `Result`.

The next step is now pretty obvious, since we have something to consume the request body, all we need to do is to feed it with Bytes, and we get our Result. That's exactly what `handleAction` does. It will get bytes from the client, deal with chunking if necessary, and feed the `Iteratee` to eventually get a `Result`, but first it calls the Filters defined in your `Global`. (`val filteredAction = app.map(_.global).getOrElse(DefaultGlobal).doFilter(action)`).

In order to feed the `Iteratee`, you need to create an `Enumerator[Array[Bytes]]`:

<script src="https://gist.github.com/jto/5644279.js"></script>

Play creates an `Enumerator` enumerating the chunks from the client, and compose it with a `BodyParser`.
Then you just need to run the resulting `Iteratee` to get a `Future[Result]`, and to send this `Result` back to the client.

<script src="https://gist.github.com/jto/5644315.js"></script>

And that's it!

## TL;DR

- `play` is actually just an alias for sbt (+ funky options)
- Each application is a server.
- Starting up an app means:
    1. Reading params + config
    2. Calling `onStart` on each plugin
    3. Creating a Netty server and listening for HTTP requests


When a HTTP request gets into Play:

1. The server calls `Global.onRouteRequest(rh: RequestHeader): Handler`
2. Most of the Time this `Handler` is actually an `EssentialAction`
3. An `EssentialAction` is just a function `(RequestHeader) => Iteratee[Array[Byte], Result]`.
4. This functions is called, and the resulting `Iteratee` is feed with chunks (Array[Byte]) from the request body.
5. Eventually, you get a `Result`, which is sent back to the client.

Next time, I'll write about DEV mode, hot reloading, and the relationship between Play and SBT.

Stay tuned!

<a class="next" href="/articles/play_anatomy_part2_sbt">Play, Anatomy of a web framework: Hot redeploy.</a>


