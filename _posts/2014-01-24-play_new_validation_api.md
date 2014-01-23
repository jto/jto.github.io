---
layout: post
title: 'Play 2.3 new validation API'
tags: playframework, scala, validation, form, json
summary: A sneak preview on Play 2.3 new validation API.
image: http://www.playframework.com/assets/images/logos/normal.png
---

<header>
For the last weeks, I've been busy working on designing and implementing a new data validation API for Play.
The API is an evolution of the JSON API created by [@mandubian](https://twitter.com/mandubian). It's based on the same concepts, but generalizes them.
</header>

<p class="warning">
  The API is still a draft and may change before the release of Play 2.3
</p>

[@mandubian](https://twitter.com/mandubian) and I talked about this Architecture and general and the new validation API at [pingconf](http://www.ping-conf.com/) in January. You may want to skip the first 30 minutes, and jump directly to the API. This article sums up what we said there, and explore the validation API a bit deeper.

<iframe style="margin: 20px auto; display: block" width="720" height="437" src="http://www.ustream.tv/embed/recorded/42778238?v=3&amp;wmode=direct" scrolling="no" frameborder="0" style="border: 0px none transparent;"></iframe>

## Why validation ?

When you think about a web application, you're probably thinking of a bunch of web-pages, or single page app, or maybe even just a REST API serving json content. Truth is, a web application can be all of that, and even more, but from a more abstract point of view, the job of a webapp is really just to answer queries. Queries are formulated using HTTP requests, and answered using HTTP responses, and that's pretty much all there is to know. HTML, JSON, XML, or any other format are "representations" of the data. Your application may, and even probably *should*, support multiple representations, so the client can list the representation it supports, and the server can then decide which one is appropriate. That's content negotiation.

The client can request different representations, but the client can also send data to your application, and again you need to support different representations.
Maybe the user is submiting a form ? You're going to receive URLFormEncoded values. Maybe this form is a bit dynamic, and the values submitted by an AJAX request in JSON? You may also offer a restful XML api. Or maybe data are sent using a proprietary protocol.

Of course, when an HTTP request comes in, one of the the first things you do is to de-serialize it's body to transform it to something more convenient than Bytes. For example an instance of a class. And once you've decided what to send back, you need to serialize that to the appropriate representation. So for each HTTP request, you'll parse, and eventually serialize data. But it's not that simple, the data coming in are not "safe". You must validate everything.

## Data validation in Playframework

Play offers two different APIs for the Job. One dedicated to Form validation, and one to JSON marshalling and unmarchalling.

### Form

The scala [form](http://www.playframework.com/documentation/2.2.x/ScalaForms) API is really simple. The core of it is the `Mapping` trait

<script src="https://gist.github.com/jto/8577076.js"></script>

The two important methods are `bind` and `unbind`. `bind` maps forms data (`Map[String, String]`) to a type `T`. Of course this mapping can fail, for example if some fields are missing, or their values are invalid. So instead of just returning a `T`, the method returns either all the validation errors, or a value of type `T`.

Here's an example from [play's documentation](http://www.playframework.com/documentation/2.2.x/ScalaForms):

<script src="https://gist.github.com/jto/8577090.js"></script>

`nonEmptyText` is just a buit-in mapping, and `optional` is just a function lifting a `Mapping[A]` to a `Mapping[Option[A]]`:

<script src="https://gist.github.com/jto/8577100.js"></script>

You build a new mapping by *composing* existing mappings together. `UserData.apply` and `UserData.unapply` are there to turn a successful mapping application into a `UserData` class instance, and a `UserData` class instance into form data.

Since all the hard work is done by `Mapping`,  you may be wondering what's the job of the `Form` object now. The form object is just providing a bunch of helpers used by the templates to get error messages, pre-filled values, etc.


### JSON

The Json API is based on 2 concepts: `Reads` and `Writes`. Obviously a `Reads` is for parsing and a `Write` is for serializing.

A `Reads` is basically just a function from a JsValue to a type `JsResult[A]`: `Reads[A] = JsValue => JsResult[A]`

<script src="https://gist.github.com/jto/8577102.js"></script>

and what is a `JsResult` ? well it can be either a success or a failure: `JsResult[A] = JsSuccess(a: A) | JsFailure(errors: Seq[(JsPath,ValidationError)])`

now compare:

<script src="https://gist.github.com/jto/8577109.js"></script>
to:

<script src="https://gist.github.com/jto/8577110.js"></script>

Yep, that's pretty much the same thing! But the Form api can also "serialize" classes instances to form values. Can we do that we Json? Of course. We just have to use a `Writes`!
And what's a `Writes` ?

<script src="https://gist.github.com/jto/8577116.js"></script>

Pretty much just a function from `A` to `JsValue`.

Now the Json API also has a class called `Format`.

<script src="https://gist.github.com/jto/8577125.js"></script>

Now let's compare the two API's side by side:

<script src="https://gist.github.com/jto/8577129.js"></script>

Using `Format`, the previous example may be implemented this way:

<script src="https://gist.github.com/jto/8578301.js"></script>

So again, you compose `Formats` to built new `Formats`. Very similar to the Form api.
We've demonstrated that appart from the different syntax, the APIs are fairly similar.

## Generalizing the JSON API

Now those two APIs are really nice, but having to learn two different API is really frustrating, especially when the only difference is the representation they handle. Having two API's also means that all your custom validation rules are duplicated. We knew play should come with a better solution, so in collaboration with [@typesafe](https://twitter.com/typesafe), and with the help of [@mandubian](https://twitter.com/mandubian) and [@sadache](https://twitter.com/Sadache) I was in charge of designing and implementing a new validation API.

The objectives are

- Support any representation through extensions.
- Easy migration from the JSON API.
- Built-in support for json and forms
- Compatibility with the template helpers

## Introducing the new validation API

The new validation API is very similar to the Json API. Let's compare `Reads` to it's generic conterpart: `Rule`

<script src="https://gist.github.com/jto/8578308.js"></script>

The obvious difference is the new `I` type parameter. I is the input type, generally the type you're parsing. for example if you define a validation of `JsValue` to `Int`:

<script src="https://gist.github.com/jto/8578314.js"></script>

Instead of a `JsResult`, the result of applying a Rule returns a `VA[I, O]`, which is just a type alias:

<script src="https://gist.github.com/jto/8578321.js"></script>

Validation, just like JsSuccess from the Json API, has two possible implementations:

<script src="https://gist.github.com/jto/8579033.js"></script>

Just like the Json API, you can compose rules together:

<script src="https://gist.github.com/jto/8578328.js"></script>

Here you've noticed one of the key difference with the Json API. Since the API is not only dedicated to one representation, we need to tell the compiler what representation you want to work with using `From[...]`. Since we enclosed the validation in a `From[JsValue]`. We are now defining a `Rule`validating a Json AST.

Note that we are also importing `import play.api.data.mapping.json.Rules._`. That object contains all the built-in validation for the Json type.

Since the API also supports forms data, we can define a form validation very easily:

<script src="https://gist.github.com/jto/8578334.js"></script>

We just had to change the From type, and the import.

## Differences with the Json API

Even though the validation API is largely inspired from the JSON api, there are stil a few key differences:

### Type signature

The JSON API is always assuming your going from, or to json. Since the new API is generic, you always have to be explicit about the `I` and `O` types.
This change has some impact on the API use and possibilities. The most obvious is that the new API is a tiny bit more verbose than the json API.

But the generalization also impacts positively the API, and some things are easier to implement.

### Sequential composition

Let's say you implemented 2 Rules (their implementations is let as exercise to the reader):

<script src="https://gist.github.com/jto/8578771.js"></script>

You may want to create a new Rule, validating that a given JsValue is a positive Int. All you have to do is to compose those rules sequentially. First you test the value is an Int, that you test it's value. That's a very simple task with the API.

<script src="https://gist.github.com/jto/8578777.js"></script>

With the Json API, a `Reads` always parses `JsValue`.  You just can't define a Reads validating an Int value. You're forced to implement a  `isPositiveInt: Read[Int]` directly. It makes it hard to reuse custom validations.

### lazyness

We working on recursive types, you need to be extra careful with the Json API, and use lazyRead to avoid stack overflow.

<script src="https://gist.github.com/jto/8578784.js"></script>

The new API is lazy by default, you don't have to use a "special" method anymore:

<script src="https://gist.github.com/jto/8578790.js"></script>

The new API also support the "type" notation with recursive types, while the json API didn't

<script src="https://gist.github.com/jto/8578798.js"></script>

### Numbers

The new API built-in number validations are a bit "stricter" than their equivalents of the json API. For example if you use the json validation for `Int`, and use it on `JsNumber(3.14)`, it will succeed, but truncate the value to 3. The new validation would reject the same value.

### Others

There's a bunch of other differences, must of them are just implementation details improvements. For example the `OWrites`trait isn't needed anymore. But those changes have no impact on your code.

## Playing with the new API

The API will be released with Play 2.3. You can already play with it, all you have to do is to checkout my branch: `git clone https://github.com/jto/Play20.git && git checkout new_validation_api` and [build it](http://www.playframework.com/documentation/2.2.x/BuildingFromSource).

There [documentation](https://github.com/jto/Play20/tree/new_validation_api/documentation/manual/scalaGuide/main/validation), [samples](https://github.com/jto/Play20/tree/new_validation_api/samples/scala), and [tests](https://github.com/jto/Play20/tree/new_validation_api/framework/src/play-datacommons/src/test/scala/play/api/data/validation) where you should be able to find pretty much all you need to use it.

Pull request is [here](https://github.com/playframework/playframework/pull/1904), feedbacks and contributions are welcome.

