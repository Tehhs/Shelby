# Shelby 

Shelby is both a programming language project, and a language parsing project built for fun with no parsing library (pure javascript). Ultimately, the project is intended to transpile Shelby code to both python and javascript, so the same code can run and be deployed both in the browser or locally on a machine with minimal effort. This language is not intended for production.

Warning: As of writing, compilation barley work. The project is still in heavy development.  

Below is some basic syntax. A lot of stylistic choices were borrowed from python, lua and javascript. 

```js 
:name "Liam" 
:age 25 

if age >= 20 then 
    print(":name is old")
else 
    print(":age is young!")
end 
```

# Instructions 

Put your code in input.shelby, and run with `node .`. Right now, all it does it transpile some basic variable declarations and conditional statements, transpiles to javascript and runs the code. 
