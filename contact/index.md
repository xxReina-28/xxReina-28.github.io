---
layout: page
title: "Contact"
description: "Contact Nina Suico about full-time opportunities or selective consulting and project work."
permalink: /contact/
---
{% assign profile = site.data.profile %}

<p class="lead">I am open to full-time opportunities across Southeast Asia/APAC and selective consulting or project work.</p>
<p>{{ profile.location_label }} · {{ profile.mobility_label }} · {{ profile.availability_label }}</p>

<ul class="contact-list">
  <li><a href="{{ profile.contact.linkedin }}" target="_blank" rel="noopener">LinkedIn</a></li>
  <li><a href="{{ profile.contact.email }}">Email Nina</a></li>
  <li><a href="{{ profile.contact.github }}" target="_blank" rel="noopener">GitHub</a></li>
  <li><a href="{{ profile.contact.resume | relative_url }}" target="_blank" rel="noopener">Résumé</a></li>
</ul>
