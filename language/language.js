

import { Group, SegmentList, TokenFunction, TokenOperations, select } from "../parser/Engine.js";
import { Alphabetical, Alphanumeric, CaptureUntil, MultiStringMatch, Numerical, Or, OrGroup, Space, StringMatch, TypeMatch } from "../parser/ParserFunctions.js";
import { $if } from "../parser/ConditionalSystem.js";


let segList = new SegmentList()
segList.append([`

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

`])
segList.processStrings() 


/*
    Process the comments 
*/
const Comment = () => Group(
    StringMatch("//").ref("comment_start"),
    CaptureUntil("\n").name("comment").join().main("text")
)
segList = segList.find([
    Comment()
]).transform("comment")


/* 
    Process the expressions, example: 
        1 + 1 
        A + 2 
        A / B 
*/
const Number = () => Numerical().name("value")
const VariableName = () => Alphanumeric().name("name")
const Operator = () => OrGroup(StringMatch("+"), StringMatch("-"), StringMatch("/"), StringMatch("*"))
const Operand = () => OrGroup(Number(), VariableName())
const Expression = Group(
    Operand().name //! not the group needs name() and probably other shit like passing on events omg
    //! doing this for the OrGroup is easy, just use the one it m atches 
    //! focus on the Group()  
)
segList = segList.find([
    Comment()
]).transform("comment")

console.log("FINAL =", JSON.stringify(segList, null, " "))

