import { SegmentList, TokenFunction, TokenOperations } from "./parser/Engine.js";
import { StringMatch, Numerical, Alphabetical, MultiStringMatch, TypeMatch, Or, Space } from "./parser/ParserFunctions.js"

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

    let names = ["Liam", "John", "Alex", "Bob"]
`]).processStrings()

const segmentList = sList.find([
    VARIABLE_DECL_TYPE().join(true),
    SPACE(), 
    VARIABLE_NAME(),
    SPACE().opt(),
    EQUALS(),
]).transform("var_decl_info")
.find([
    TypeMatch("var_decl_info").name("var_decl_info").collapse(true),
    SPACE().opt(),
    Or(TypeMatch("string"), Numerical()).collapse({value: "contents"})
]).transform("variable")
.find([
    StringMatch("print"),
    SPACE().opt(),
    StringMatch("("),
    SPACE().opt(),
    Alphabetical().name("variable"),
    SPACE().opt(),
    StringMatch(")")
]).transform("print_function")
.find([
    StringMatch("("),
    TypeMatch("string"), 
    StringMatch(",").opt().shift(-1),
    TypeMatch(")")
]).transform("array")
//.filterEmptyStrings()

function listed(itemTokenFunction, separatedTokenFunction) { 
    return TokenFunction.from((state)=>{ 
        const op = itemTokenFunction.call(state)
    })
}

console.log("Results:  ", JSON.stringify(segmentList, null, " "))