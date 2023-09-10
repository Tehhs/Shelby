

import { SegmentList, TokenFunction, TokenOperations, select } from "../parser/Engine.js";
import { Alphabetical, Alphanumeric, CaptureUntil, MultiStringMatch, Numerical, Or, Space, StringMatch, TypeMatch } from "../parser/ParserFunctions.js";
import { $if } from "../parser/ConditionalSystem.js";


let segList = new SegmentList()
segList.append([`

//Create a variable without limits
le4tr i_two = 1000

//Create a variable that reacts to changes in variable i
l3et b = i / 2

`])
segList.processStrings() 


/*
    Process the comments 
*/
segList = segList.find([
    StringMatch("//"),
    CaptureUntil("\n").name("comment").join()
]).transform("comment")

/*
    Find the expressions
*/
const Variable = () => Group(StringMatch("$"), Alphabetical()).name("VVV") //! grouping not supported yet
const Number = () => Numerical()
const StringType = () => TypeMatch("string")
const Operation = () => Or(StringMatch("/"), StringMatch("*"), StringMatch("+"), StringMatch("-"))
const Operand = () => Or(
    Variable(), 
    Number()
)
segList = segList.find([
    Operand().name("operand1"),
    Space().opt().name("?"),
    Operation().name("operation"),
    Space().opt().name("??"),
    Operand().name("operand2")
]).transform("expression")




console.log("FINAL =", JSON.stringify(segList, null, " "))

