

import { SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Alphanumeric, MultiStringMatch, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";
import { $if } from "../../parser/ConditionalSystem.js";

const BooleanType = () => MultiStringMatch("true", "false") 
const VariableName = () => Alphabetical()
//! NEXT, wokr out how to give child tfFuncs in OR control over transformation, stringtype collapses is example 
const Item = () => Or(Numerical(), BooleanType(), VariableName()).push("values").join()
const Comma = () => StringMatch(",")

let segList = new SegmentList()
segList.append([`[var,12,true,52,55]`])
segList.processStrings() 


segList = segList.find([
  StringMatch("["),
  Item().opt(),
  $if(Comma().opt()).then(
    Item(),
    TokenFunction.self()
  ).end(),
  StringMatch("]")
]).transform("variable_value")


console.log("FINAL =", JSON.stringify(segList, null, " "))

