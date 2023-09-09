

import { SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Alphanumeric, MultiStringMatch, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";
import { $if } from "../../parser/ConditionalSystem.js";

const BooleanType = () => MultiStringMatch("true", "false") 
const StringType = () => TypeMatch("string")
const VariableName = () => Alphabetical()
const Item = () => Or(Numerical(), BooleanType(), VariableName()).push("values").join()
const Comma = () => StringMatch(",")

let segList = new SegmentList()
segList.append([`[var,12,true]`])
segList.processStrings() 


segList = segList.find([
  StringMatch("["),
  Item(),
  $if(Comma().opt()).then(
    Item(),
    TokenFunction.self()
  ).end()
  
  // $if(Comma().opt()).then(
  //   Or(Numerical(), BooleanType()).push("values").join()
  // ).end()

]).transform("variable_value")


console.log("FINAL =", JSON.stringify(segList, null, " "))

