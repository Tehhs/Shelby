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
