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

* (almost done) Build and perfect the custom parser
* (current) Use parser to compile Shelby code into json
* Use json ot build into NASM
* NASM to executable

# Instructions 

Code cannot be deployed at the moment. Most of the current work is being put into making the parser as easy and bug-free as possible.

# Custom Parser 

As mentioned, this project makes use of a custom parser. Code for this parser can be found in /parser/engine. Below is real working code for parsing some basic syntax. 

```js
const VARIABLE_DECL_TYPE = _ => MultiStringMatch("let", "number").name("var_decl_type")
const VARIABLE_NAME = _ => Alphabetical().name("variable_name")
const EQUALS = _ => StringMatch("=")
const SPACE = _ => Space() 

const sList = new SegmentList(); 
sList.append([`
    let a = 5 
    let b= "yes"
    print(a)
    print(b) 
`]).processStrings()

const segmentList = sList.find([
    VARIABLE_DECL_TYPE(),
    SPACE(), 
    VARIABLE_NAME(),
    SPACE().opt(),
    EQUALS(),
]).transform("method_decl")
.find([
    TypeMatch("method_decl"),
    SPACE().opt(),
    Or(TypeMatch("string"), Numerical()).name("value")
]).transform("method_decl_1")
.find([
    StringMatch("print"),
    SPACE().opt(),
    StringMatch("("),
    SPACE().opt(),
    Alphabetical().name("variable"),
    SPACE().opt(),
    StringMatch(")")
]).transform("print_function")
.filterEmptyStrings()

console.log("Results:  ", JSON.stringify(segmentList, null, " "))
```

Should be transformed into the below json (or something like this)

```json
[
  "\n    ",
  {
   "type": "method_decl_1",
   "value": [
    "5"
   ]
  },
  " \n    ",
  {
   "type": "method_decl_1",
   "value": [
    {
     "type": "string",
     "contents": "\"yes\""
    }
   ]
  },
  "\n    ",
  {
   "type": "print_function",
   "variable": [
    "a"
   ]
  },
  "\n    ",
  {
   "type": "print_function",
   "variable": [
    "b"
   ]
  },
  " \n"
]
```
