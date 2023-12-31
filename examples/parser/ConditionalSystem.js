/*
find(
    StringMatch("A"), 
    if(StringMatch("B")).then(
        StringMatch("C"),
        if(StringMatch("D")).then(
            StringMatch("E")
        )
    ).elseif(StringMatch("5")).then(StringMatch("6"))
    .else(
        StringMatch("6"),
        StringMatch("7")
    ).end() 

).to("alphabet")
*/

import { SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";
import { $if } from "../../parser/ConditionalSystem.js";

let segList = new SegmentList()
segList.append([`wz`])

segList = segList.find([
  $if(StringMatch("a").push("lettersa").opt())
  .then(
    StringMatch("b").push("letters")
  ).else(
    StringMatch("z").push("letters")
  ).end(),
]).transform("transformation")


console.log("FINAL =", JSON.stringify(segList, null, " "))

/* 

*/ 