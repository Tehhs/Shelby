

import { SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Alphanumeric, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";
import { $if } from "../../parser/ConditionalSystem.js";

const Item = () => Alphanumeric() 
const Comma = () => StringMatch(",")

let segList = new SegmentList()
segList.append([`
  let list = [item1,jamesBond,liam,askljdfbnaskljhdfbn]
  let array = [pineapple,--jam]
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
  TypeMatch("list").collapse([
    //todo kinda weird here
    select("items").rename("items") 
  ]).delete()
]).transform("variable")
//todo in the final object if you want to add extra keys ("variable_type = array") allow that 
//todo in the transform, supply object instead and append type to object if not supplied?


console.log("FINAL =", JSON.stringify(segList, null, " "))

