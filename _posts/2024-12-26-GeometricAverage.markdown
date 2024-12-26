---
layout: post
author: Cole
title: "Better Betting Odds"
permalink: GeometricAverage
date:   2024-12-26 1:00:00 -0500
categories: [Statistics]
tags: [Numpy, Scipy, Python, Statistics, Finance, Bet, Geometric, Average, Expected, Value, Options, Stock, Black, Swan, Safe, Haven, Taleb, Spitznagel, Insurance, Growth, Scientific, Scientific Computing, Scientific Programming, Computing, Programming, Review, Documentation]
---

# How to Calculate Betting Odds Well

If we are presented with a single bet and we just want to consider whether or not to take it, it might be
productive to just calculate the bet's expected value - which is what people usually do.
In life, we need to consider whether to take some investment or career bets which affects our
bag repeatedly, we will make these bets again and again year after year.
When we just use expected value(arithmetic average) to decide whether or not to take some bet we miss
much information. It is possible - even likely - that we will go bust on a favorable bet that has
negative returns if we repeat it year over year, e.g. very high interest bonds.
When we instead use the geometric average to calculate the expected returns of some bet,
we take into account our probaility of going bust and compounding returns.

For example, if we choose between two bets for which we will repeat 10 times and with the same expected return of 14%.
```
Bet #1 - 9/10 chance of 10% return and a 1/10 chance of a 50% return.
Bet #2 - Always a 14% return.
```
Both bets have an expected return of 14% but the geometric averages are 3.53 and 3.70 respectively - the second option will have 5% better returns in the long term.
We calculate this as follows, there are different ways to do so but this is simplest to just weight the repeats on the probability space since we only care about comparison here.
```
1 - (1.1 ** 9) * 1.5
1 - 1.14 ** 10
```

This is decently helpful to know so we can be more precise and confident while making decisions, but using geometric
average is criticial when we face chances of negative returns like the Saint Petersburg paradox.
In the Saint Petersburg paradox we are shipping cargo with an expected return of 10% across some canal, but there is a chance
that pirates will seize the ship netting us a -100% loss. In this example we find it is much more profitable and effective
to insure our ships and break up the shipments into multiple ships. Even though insurance will give us a percent cost across the
board, it takes the downside down significantly. Read more in the references.

## References

[Universa Investments on Saint Petersburg Paradox](https://universa.net/)

[Saint Petersburg Paradox](https://en.wikipedia.org/wiki/St._Petersburg_paradox)

Safe Haven: Investing for Financial Storms by Mark Spitznagel
