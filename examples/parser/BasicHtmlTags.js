import { SegmentList, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";

let segList = new SegmentList()

const TagType = () => {
  return Or(StringMatch("div"), StringMatch("span")).name("tag_type").join()
}
const Text = () => { 
  return Alphabetical().join().name("text")
}

segList.append([`
  <div> Hello </div> 
  <span> There </span>
`])
segList.processStrings() 
segList = segList

//Opening Tags 
.find([
  StringMatch("<"), 
  TagType(),
  StringMatch(">")
]).transform("open_tag")

//Closing Tags 
.find([
  StringMatch("</"), 
  TagType(),
  StringMatch(">")
]).transform("close_tag")

//Combine the two 
.find([
  Space(true),
  TypeMatch("open_tag").collapse([select("tag_type").rename("tag")]), 
  Space(true),
  Text(),
  Space(true),
  TypeMatch("close_tag"),
  Space(true),
]).transform("tag")

.filterEmptyStrings()



//This example could be improved by showing how you can ensure the parser looks for the correct closing tag 
//this can be done with the context object, but do you even want to do that in the first place? might kill the 
//parse process because of some tag incompatibility 
console.log(JSON.stringify(segList, null, " "))

