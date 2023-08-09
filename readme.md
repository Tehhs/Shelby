# Shelby 

Shelby is both a programming language project, and a language parsing project built for fun with no parsing library (pure javascript). Ultimately, the project is intended to transpile Shelby code to both python and javascript, so the same code can run and be deployed both in the browser or locally on a machine with minimal effort. This language is not intended for production.

Warning: As of writing, compilation barley work. The project is still in heavy development.  

Below is some basic syntax. A lot of stylistic choices were borrowed from python, lua and javascript. 

```js 

let 0<i<10 = 0
let b = $i / 2
object c = {num: i}
number index

once $i && $b then 
    print("Index =", b)
    i++ or throw 
end 

```

# Instructions 

Put your code in input.shelby, and run with `node .`. Right now, all it does it transpile some basic variable declarations and conditional statements, transpiles to javascript and runs the code. 

# Custom Parser 

As mentioned, this project makes use of a custom parser. Code for this parser can be found in /parser/engine. The parser is being rebuilt as it the old one sucked. Using the parser in the future should look something like this while parsing a simple Java method declaration. 

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
