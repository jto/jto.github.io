---
layout: post
title: 'Play, Anatomy of a web framework: Hot redeploy.'
tags: playframework, scala, hot reload, sbt
summary: Today, I'll show how playframework hot reloads code, and explain the relationship between play and sbt.
image: http://www.playframework.com/assets/images/logos/normal.png
---

<header>
In this series of article, I'll explain the internals of [playframework](http://www.playframework.com/ "play"). I'll try to show how play works, from starting an application to rendering the HTTP response. Today, I'll show how playframework compiles and hot reloads code, and explain the relationship between play and sbt.
</header>

## Play and SBT

One of the key features in Play is its ability, unlike most JVM based framework, to hot reload all code modifications in DEV mode without relying on any external tool (You don't need JRebel). In order to understand how that works, we first need to see how Play uses SBT to compile classes, and how SBT is tightly integrated into Play.

We've seen in the [previous article](/articles/play_anatomy_part1_bootstrap/) that SBT in the entry point of any play application, and that the `play` command is essentially just an alias on `sbt`. The crucial part making a play application different from a typical scala application built with SBT is play's [sbt plugin](https://github.com/playframework/Play20/tree/master/framework/src/sbt-plugin/src/main).

As you can see, this is a pretty big SBT plugin. There's a good reason for that: It does __A LOT__.

First of all, play adds a bunch of settings:

<pre>
play-assets-directories           play-build-require-assets        play-closure-compiler-options
play-coffeescript-entry-points    play-coffeescript-options        play-common-classloader
play-compile-everything           play-conf                        play-copy-assets
play-default-port                 play-dev-settings                play-dist
play-external-assets              play-javascript-entry-points     play-less-entry-points
play-less-options                 play-monitored-files             play-onStarted
play-onStopped                    play-package-everything          play-plugin
play-reload                       play-require-js                  play-require-js-folder
play-require-js-shim              play-require-native-path         play-routes-imports
play-templates-formats            play-templates-imports           play-version
</pre>

It also adds Tasks:

<pre>
classpath                  Display the project classpath.
clean                      Clean all generated files.
compile                    Compile the current application.
console                    Launch the interactive Scala console (use :quit to exit).
dependencies               Display the dependencies summary.
dist                       Construct standalone application package.
exit                       Exit the console.
h2-browser                 Launch the H2 Web browser.
license                    Display licensing informations.
package                    Package your application as a JAR.
play-version               Display the Play version.
publish                    Publish your application in a remote repository.
publish-local              Publish your application in the local repository.
reload                     Reload the current application build file.
run &lt;port&gt;                 Run the current application in DEV mode.
test                       Run Junit tests and/or Specs from the command line
eclipse                    generate eclipse project file
idea                       generate Intellij IDEA project file
sh &lt;command to run&gt;        execute a shell command
start &lt;port&gt;               Start the current application in another JVM in PROD mode.
update                     Update application dependencies.
</pre>

Now you want to have a look at [`PlaySettings.scala`](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlaySettings.scala). This is where all the default settings are defined. We're interested in [`run`](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlaySettings.scala#L114).

Typing `play run` calls `playRunSetting`, which is defined in [`PlayRun.scala`](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlayRun.scala#L57).

Let's have a look at what it does:

- it keeps the sbt classloader ([l72](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlayRun.scala#L72)).
- it creates a "common" classloader able to load "common" jars ([l74](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlayRun.scala#L74-L77)).
Those jar are used both by your application and sbt. They won't be reloaded.
- it creates the application classloader, child of the common classloadder, which loads all the application dependencies ([l90](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlayRun.scala#L90-L138)).

This particular classloader is especially interesting.
First of all, it's the one "in charge" of class reloading.
Although it's not a child of `sbtClassloader`, it will [delegate](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlayRun.scala#L104) the loading of shared classes to it.

### Running a play application

So we've created a fancy classloader hierarchy. We're now ready to run the application. Obviously, like for `start`, it's just a matter of calling a `main` somewhere. We've seen in the previous article that main is in `play.core.server.NettyServer`.
Interestingly, play is not using a SBT setting here, the class name is just [hardcoded](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlayRun.scala#L142).

So, all we have to do is to invoke `mainDevHttpMode`.

We're almost there, but hey, we haven't talked about class reloading yet! The methods is given a [`reloader`](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlayReloader.scala).
That reloader has type `SBTLink`.

Each time a request hits the server, the application calls the reloader, asking to check if there's any code changes.
The reloader will then delegate recompilation (or other necessary tasks, like copying static assets) to SBT.

Ok that was fairly simple, but why should we bother creating an `SBTLink` when SBT is absolutely capable of watching files for modifications natively?

Two reasons:

- First, Play needs to know when a compilation error happens, so that it can pop a nice error page in your browser.
- Then, Hot reload of course! It's nice to have code recompiled, but the application is still running on the old classes. There's more todo

### Where the magic begins

[Here](https://github.com/playframework/Play20/blob/master/framework/src/sbt-plugin/src/main/scala/PlayReloader.scala#L303-L342)'s the real trick. Assuming the compilation succeeded, we need to update the loaded classes in the JVM.
How do we do that? Simple. We just remove the old application classloader, and create a new one with the updated classes.

Then, we simply [restart](https://github.com/playframework/Play20/blob/master/framework/src/play/src/main/scala/play/core/system/ApplicationProvider.scala#L125-L140) the application, and only the application. No need to restart the JVM.

And that's it! New code is executed. All happened in a few seconds (hopefully), developers are happy :)

### It's a tradeoff

Replacing classloader to hot reload code is simple and works very well, but it comes at a price.

First of all, it's only possible because Play is stateless, and is pretty lightweight (quick start).
Then, it creates a tight dependency between the build system and the framework.

Most Java or Scala framework can be used with any build system you like, in play, you're not getting rid of SBT anytime soon.

Finally, it occasionally messes with with certain libraries that are not using the "correct" classloader.

## Why it's not possible in JEE frameworks.

> Wait a minute!
> If it's __THAT__ simple why is not everybody using that technique !!!??? I mean... I wait for my beloved "Java Enterprise Server<sup>&reg;</sup>" to restart for __AGES__ every day! <small>Also, My `ruby on rails` coworkers are making fun of me</small>.
>
> Why are those people wasting my time, making me feel miserable !!!???
> <span class="from">Enterprise Java Architect, having an epiphany</span>

The answer is pretty simple. Because your application is _stateful_!

You're keeping object instances in memory between requests. Assuming the code changed, what do you do with those "old" object instances ? Their class definitions may have changed. If you discard the classloader, you're also discarding all the instances it has created. That would typically mean loosing all session data at each reload, which in a typical application, would be very annoying.

In a JEE app, redeploying also means restarting a bunch of "services" provided by the application server (JNDI, Database connections pools, EBJ, JMX, CDI, etc.), which takes a long long time. Hot reload is not the only problem here.

Since play is completely stateless and fairly lightweight, trashing everything is not a problem a all.

The "all inclusive" philosophy of a enterprise application servers comes at a price, and let's face it, your not using 10% of the features anyway.

### I don't care, I use JRebel!

Good for you!

Since [Jrebel](http://zeroturnaround.com/software/jrebel/) is not open source, it's pretty hard to know how exactly it is working. Their [faq](http://zeroturnaround.com/software/jrebel/resources/faq/) does not say a lot, but they published a blog post a while ago explaining the basics:

It adds a java agent that rewrite the bytecode loaded into the JVM which:

- adds a field to each class, holding references to fields added to the object
- adds a field to each class, holding references to anonymous classes with actual methods implementations
- modify the methods of the classes to mask the above changes.

Of course when a class is modified you need to track the changes impact, and "reload" classes accordingly. That alone is pretty hard.

## TD;DR

- Play simply reloads code by trashing the application classloader and restarting everything, which comes at the price of SBT being deeply integrated into the framework.
- The JEE architecture is stateful, and too heavy anyway to allow that kind of feature.
- JRebel is rocket surgery (yes, surgery) compared to play.

Next time we'll see how play routes request and invoke the application code. It should be the last article of the series.

