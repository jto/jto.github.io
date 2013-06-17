---
layout: post
title: 'Play, Anatomy of a web framework: Routing and reverse routing.'
tags: playframework, scala, routing, sbt
summary: Today, I'll show how playframework hot invoke application code.
image: http://www.playframework.com/assets/images/logos/normal.png
---

<header>
In this series of article, I'll explain the internals of [playframework](http://www.playframework.com/ "play"). I'll try to show how play works, from starting an application to rendering the HTTP response. Today, I will cover the routing of an HTTP request. How play compiles the route file, and invoke the application code, and let you use the reverse router.
</header>

## Play and SBT (again)

In your play application, you surely wrote a route file. It looks something like this:

<pre>
GET     /                           controllers.Application.index
GET     /hello/:name                controllers.Application.sayHello(name: String)
GET     /assets/*file               controllers.Assets.at(path="/public", file)
</pre>

In play, and contrary to most scala web frameworks, the route file is not written in an internal scala DSL. This approach has a bunch of drawbacks: obviously it's not nicely scriptable as a Scala file would be, and it adds a bit of complexity to the framework. But since play is both a Java **and** Scala framework, it makes sense to use an external DSL (Java developers don't want to write Scala code). One could argue that Play should support Scala or Java for route definition, like it does for the rest of the API. It's probably possible, I don't think Java is expressive enough for the job thought.

In Play 1.x, actions were invoked dynamically. Each time a HTTP request hits the server, the application would figure out the correct action to call, and invoke it using reflection.

Play 2.x, focuses much more on typesafety. If the action definition and the route file don't match, we want the compiler to tell us. We want to detect non existing actions, type error etc. Putting it simply, we want the security provided by the Scala compiler for our routes.

### Source Generation

SBT has a special setting for source generation. It's called [sourceGenerator](http://www.scala-sbt.org/0.12.3/docs/Howto/generatefiles.html).
And we can see play using it [here](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlaySettings.scala#L102).

`RouteFiles` is defined in [PlaySourceGenerator.scala](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlaySourceGenerators.scala), it calls `compile`, which is define in [`play.router.RoutesCompiler`](https://github.com/playframework/Play20/blob/master/framework/src/routes-compiler/src/main/scala/play/router/RoutesCompiler.scala).

This generator is composed of two parts:

- a parser called [RouteFileParser](https://github.com/playframework/Play20/blob/master/framework/src/routes-compiler/src/main/scala/play/router/RoutesCompiler.scala#L59-L242), extending [JavaTokenParsers](http://www.scala-lang.org/api/current/index.html#scala.util.parsing.combinator.JavaTokenParsers)), defined using the Scala parser combinators API.

- generators functions (router, reverseRouter, javaWrapper, javascriptReverseRouter, refReverseRouting, reverseRouteur). each takes the output of the parser, and generate a Scala source.

#### Route file parser

If you're not familiar yet with parser combinator, [this article](http://www.codecommit.com/blog/scala/the-magic-behind-parser-combinators), by Daniel Spiewak is a really nice intro.

The grammar of play route files is here, each element of syntax being represented by a `def`.
For example:

<script src="https://gist.github.com/jto/5796869.js"></script>

The output of this parser is a `ParseResult[List[Rule]]`.
If the route file is correctly defined, you get a `Success[List[Rule]]`, otherwise, a positionned Failure, with the error message. This way, Play can give you a nice error message if you made a mistake.

Alright, so far we've parsed the application route file, which gives us a list of `Rule`.
We now need to generate the corresponding Scala code.

#### Code generation

Code generation functions are basically just mapping each `Rule` to a String. It's nothing more than basic String manipulation. Let's have a look a the generated code for routing.

Once you've compile your project, the generated sources will be under `target/scala-2.10/src_managed`.
Play generated a router (`routes_routing.scala`) and a reverse router file (`routes_reverseRouting.scala`).

#### Router

<script src="https://gist.github.com/jto/5797501.js"></script>

For each `Rule` defined in the route file, the `routes` function tries to pattern match the incoming `RequestHeader`. If a valid route is found (something matched), `invokeHandler` simply calls the correct Action. It may use a QueryStringBindable, or a PathBindable to parse the parameters to the required types.

#### Reverse router

<script src="https://gist.github.com/jto/5797493.js"></script>

Each function in `ReverseApplication` simply matches the names of the `Actions` in `Application`.
This way you can simply call them directly, and you'll get a String. Since the parameters of those functions are the same as your Actions, the compiler will type check everything nicely.

### Using the Reverse routing

Alright, so far we have generated functions invoking the Application actions based on RequestHeader, and reverseRouters, generating a String given the Action parameters.

Question is where is Play using that code?
For the reverse routers, the answer is obvious. You're almost calling them directly. For example if you write `routes.Application.sayHello("Julien")` in a template, you're simply calling the `sayHello` method in a `ReverseApplication` instance.

The reason you don't have to call ReverseApplication.sayHello, but Application.sayHello is because play generates a Java file mapping the reverse router classes names to the controller classes. This class is  located under `target/scala-2.10/src_managed/controller` and looks like this:

<script src="https://gist.github.com/jto/5797867.js"></script>

### Using the router

Now last question is, when is the router called ?
We've seen in the [previous article](/articles/play_anatomy_part2_sbt) that play delegates routing to the Global object. Let's have a look at the [default global](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/api/GlobalSettings.scala), which you normally either use directly, or extend when you define you own Global.

The `onRouteRequest` method, calls `router.handlerFor(request)`. router is an Option in the current [Application](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/api/Application.scala). handlerFor simply [`lift`](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/router/Router.scala#L345) the `PartialFunction[RequestHeader, Handler]` generated by play to a `Function[RequestHeader, Option[Handler]]`.

## TL;DR

- Play uses the application routes file to generate scala sources of router an reverse routers
- Those sources are in `target/scala-2.10/src_managed`
- reverse routing is (almost) directly called by the user
- the router is called in `Global.onRouteRequest`

<a class="previous" href="/articles/play_anatomy_part2_sbt">
  <span>Play, Anatomy of a web framework: Hot redeploy.</span>
</a>