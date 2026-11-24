# Week 02

<!-- Your own reflection on the week, in English, about one A4 page. The points for the week are under "Weekly report"
on the week page in Canvas, and README.md in this folder tells you how to write it. Write your text below this comment;
pictures go in report/img/. -->

On Monday I started doing week 02s exercises. The limited experience I've had with node.js has been with express, so the first exercise served as a refresher for me. 

2-20 challenged me abit more, as I had never used a router or middleware in node/express before. It was logical to me and I understood the flow. I had a few issues getting it to work, because I forgot to export the router at first. Also had to adjust the /api/hello/:name endpoint when trying the challenge, as just using toLowerCase() directly on the query would throw a error if the query was undefined.

2-25 was more of the same. Since I have made webservers in both Deno and PHP before I've had to consult documentation several times before, so understanding the node.js documentation was something that felt familiar. I now feel like I have gotten confortable with the node.js express syntax, as writing the endpoint-handlers and tests felt natural. The challenge took som trial and error but got there in the end. At first I did not understand exactly what "Write a test for it: how do you make the server answer 503 in a test, whatever machine it runs on?" meant but I figured it out. I solved it by setting the query to Infinity if the result of parsing the query to a int was NaN. As Infinity is the largest number in JS, the free memory will always be smaller which I can use to make sure my test always gets 503 returned.

ejs was something completely new to me. I had not heard of it before this exercise. At first I found it a little difficult to understand, but after asking AI to explain it to me simply, I got it better. I actually really like the functionallity of it. As I've previously written PHP I saw similarities with ejs in the way that you can write pure HTML + script in the same file. It will definitely take more practice for this to really land and feel comfortable for me, but even if this is not a huge part of the course, will probably be something I investigate / work with further in my spare time. 