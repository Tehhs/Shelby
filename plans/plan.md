find a way to deal with list of things 
find a wsya to deal with optional things 


 * End statements 
 */
brandNewSegments = findAndSegment(brandNewSegments, [
    {
        validator: StringMatch("end"), 
        truthFunction: (segs) => segs.join("")=="end"
    }
], function() { 
    return {type: "end"}
}) 

const returns = { 
    save: 1, //save result, true 
    load: 2, //return the last saved result, false,
    ignore: 3, //ignore this token and reset, for optional

}

Segments.find([
    OR(StringMatch("public"), StringMatch("protected")),
    Opt(StringMatch("static")).name("static").propagte(),
    StringMatch("void"), 
    FunctionName().name("FunctionName").propagate()
    MethodBlock().name("method_block").propagate(),
    Opt(StringMatch(",")).reset() 
).transform("method") 



find(
    StringMatch("["),
    alphanumeric(),
    if(comma()).then(
        alphanumeric(), 
        self() // the if condition
    )
    StringMatch("]")
).to("list")

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
    )
).to("alphabet")