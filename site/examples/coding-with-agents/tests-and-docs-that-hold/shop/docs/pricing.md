# Pricing rules

An order is a list of lines. Each line has a quantity and a unit price in
euros, and the subtotal is the sum of quantity times price over the lines.

Shipping is added to the subtotal. It is 4.95 EUR for every order below
the free-shipping threshold, and free from 50.00 EUR. The threshold is
compared with the subtotal before shipping.

Every amount is rounded to cents.
