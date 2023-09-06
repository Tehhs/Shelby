

import { SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Alphanumeric, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";
import { $if } from "../../parser/ConditionalSystem.js";

const Item = () => Alphanumeric() 
const Comma = () => StringMatch(",")

let segList = new SegmentList()
segList.append([`
  let list = [item1,jamesBond,liam,askljdfbnaskljhdfbn]
`])


segList = segList.find([
  StringMatch("["),
  Item().push("items").join(), 
  $if(Comma().opt()).then(
    Item().push("items").join(),
    TokenFunction.self()
  ).end(),
  StringMatch("]")
]).transform("list")

segList = segList.find([
  StringMatch("let"),
  Space(), 
  Alphabetical().name("variable_name").join(), 
  Space().opt(),
  StringMatch("="),
  Space().opt(), 
  TypeMatch("list").name("the_list")
]).transform("variable")




console.log("FINAL =", JSON.stringify(segList, null, " "))

/* 

*/ 