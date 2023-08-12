import { SegmentList, TokenFunction, TokenOperations } from "./Engine.js";
import { StringMatch, Numerical, Alphabetical, MultiStringMatch, TypeMatch, Or, Space } from "./ParserFunctions.js"

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
    //Opt(SPACE).name("Hello?"),
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

console.log("Results:  ", JSON.stringify(segmentList, null, " "))