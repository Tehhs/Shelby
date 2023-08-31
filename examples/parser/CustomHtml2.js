import { SegmentList, TokenFunction, TokenOperations, select } from "../../parser/Engine.js";
import { Alphabetical, Numerical, Or, Space, StringMatch, TypeMatch } from "../../parser/ParserFunctions.js";

let segList = new SegmentList()

const TagType = () => {
  return Or(StringMatch("div"), StringMatch("span")).name("tag_type").join()
}
const Text = () => { 
  return Alphabetical().join().name("text")
}

segList.append([`
  
  div/.bold/.italic/$jump<?>/$click<console.log(\`awesome\`)> Click me! 

`])

//todo there can be parts of the input that you dont want to transform to string objects, 
//todo cont. this is why we need to use ` in the above append as a temp solution 
segList.processStrings() 
segList = segList

//Find classes
.find([
  StringMatch("/"),
  StringMatch("."),
  Alphabetical().name("class_name").join(), 
]).transform("class_decl")

//Find Js enclosures
.find([
  StringMatch("<"),
  StringMatch("$"),
  Alphabetical().name("event_name").join(), 
]).transform("class_decl")

//Find events
.find([
  StringMatch("/"),
  StringMatch("$"),
  Alphabetical().name("event_name").join(), 
  StringMatch("<"),
  CaptureUntil(">").name("javascript").join(), //! now we need join to handle objects too,
  StringMatch(">")
]).transform("js_decl")


// .filterEmptyStrings()

function CaptureUntil (...disallowedStringsArray) { 
  return TokenFunction.from(
    ({state}) => { 
      const lastState = state[state.length-1];
      if(disallowedStringsArray.includes(lastState)) { 
        return TokenOperations.LOAD;
      } else { 
        return TokenOperations.SAVE;
      }
    }
  )
}

//This example could be improved by showing how you can ensure the parser looks for the correct closing tag 
//this can be done with the context object, but do you even want to do that in the first place? might kill the 
//parse process because of some tag incompatibility 
console.log(JSON.stringify(segList, null, " "))

