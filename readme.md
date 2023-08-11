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

# Instructions 

Put your code in input.shelby, and run with `node .`. Right now, all it does it transpile some basic variable declarations and conditional statements, transpiles to javascript and runs the code. 

# Custom Parser 

As mentioned, this project makes use of a custom parser. Code for this parser can be found in /parser/engine. The parser is being rebuilt as it the old one was difficult to use. Using the parser in the future should look something like this while parsing a simple Java method declaration. 

```js
Segments.find([
    OR(StringMatch("public"), StringMatch("protected")),
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
    "inner": [
        {
            "name": "static",
            "value": "static"
        },
        {
            "name": "FunctionName",
            "value": "main"
        },
        {
            "name": "method_block", 
            "value": ...
        }
    ]
}
```
