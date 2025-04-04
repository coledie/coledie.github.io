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
bag/wallet/portfolio repeatedly, we will make these bets again and again year after year.
When we just use standard expected value(arithmetic average) to decide whether or not to take some bet we miss
much information. It is possible - even likely - that we will go bust on a favorable bet that has
negative returns if we repeat it year over year, e.g. very high interest bonds.
When we instead use the geometric average to calculate the expected returns of some bet,
we take into account our probaility of going bust and compounding returns.

For example, if we choose between two bets for which we will repeat 10 times and with the same arithmetic average of 20% return on investment.
```
Bet #1 - 9/10 chance of 33% return on investment and a 1/10 chance of a 2% roi - 2% removes the trailing 3's on ev calculation.
Bet #2 - Always a 20% return on investment.
```
Both bets have an arithmetic average of 20% but the geometric averages show expected 10 year returns of 1328% and 620% respectively,
it's not even close but we'd loose all this critical information if we only check the arithmetic average.

These values are calculated as,
```
Bet #1 - (1.33 ^ 9) * 1.02
Bet #2 - 1.2 ^ 10
```

This is helpful to know so we can be more precise and confident while making decisions, but using geometric
average is criticial when we face chances of negative returns like the Saint Petersburg paradox.
In the Saint Petersburg paradox we are shipping cargo with an expected return of 10% per shipment across some canal, but there is a chance that pirates will seize each ship netting us a -100% loss. In this example we find it is much more profitable and effective
to pay the cost to insure our ships and break up the shipments between several ships. Even though insurance will give us a percentage cost across the board, it wipes out the downside and increases our
geometric returns tremendously.

## References

[Universa Investments on Saint Petersburg Paradox](https://universa.net/)

[Saint Petersburg Paradox](https://en.wikipedia.org/wiki/St._Petersburg_paradox)

Safe Haven: Investing for Financial Storms by Mark Spitznagel
