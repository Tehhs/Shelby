Despite how expressive JS is, there are things that get a little annoying. 

```js

  const Alphanumerical = Shelby`Alphanumberical`(
    Shelby.OR(String(), Number())
  )

  Shelby(str).parse(
    Shelby.TEXT(""), 
    Alphanumberical()
  )

```

```

  tag_type { 
    "div" | "span"
  }

  open_tag { 
    <(tag_type)>
  }

  close_tag { 
    </(tag_type)>
  }

  tag { 
    open_tag~" "(Text)~" "close_tag
  }


```
