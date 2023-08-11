# Shelby 

Shelby is both a programming language project, and a language parsing project built for fun with no parsing library (pure javascript). Ultimately, the project is intended to compile directly to NASM Assembly. This language is still in development and is not intended for production.

Below is some basic syntax. A lot of stylistic choices were borrowed from lua and javascript, and the reactive variables and code blocks were inspired by Svelte. 

```js 
//Create a variable with limits 
let 0<i<10 = 0

//Create a variable without limits
let i2 = 1000

//Create a variable that reacts to changes in variable i
let b = $i / 2

//Objects that will also auto-update and react to changes in variable i
let c = {num: $i}

//variable which inforces number type 
number n = 8

//conditional block of code that will auto-run when changes to both variable i and variable b occur 
if $i == 5 then 
    print("variable i equals five")
else
    print("variable i does not equal five")
end 

```

# Progress

* > Build and perfect the custom parser
* - Use parser to compile Shelby code into json
* - Use json ot build into NASM
* - NASM to executable

# Instructions 

Code cannot be deployed at the moment. Most of the current work is being put into making the parser as easy and bug-free as possible.

# Custom Parser 

As mentioned, this project makes use of a custom parser. Code for this parser can be found in /parser/engine. The parser is being rebuilt as it the old one was difficult to use. Using the parser in the future should look something like this while parsing a simple Java method declaration. 

```js
Segments.find([
    OR(StringMatch("public"), StringMatch("protected")).name("AccessType").propagate(),
    Opt(StringMatch("static")).name("static").propagte(),
    StringMatch("void"), 
    FunctionName().name("FunctionName").propagate()
    MethodBlock().name("method_block").propagate(),
    Opt(StringMatch(",")).reset() 
).transform("method") 
```

Should be transformed into the below json (or something like this)

```json
{
    "type": "method", 
    "static": true,
    "FunctionName": "main", 
    "AccessType": "public"
}
```
