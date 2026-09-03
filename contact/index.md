---
layout: page
title: "Contact"
description: "Contact Nina Suico about full-time opportunities or selective consulting and project work."
permalink: /contact/
---
{% assign profile = site.data.profile %}

<div class="contact-intro">
  <p class="lead">I am open to full-time opportunities across Southeast Asia/APAC and selective consulting or project work.</p>
  <p>{{ profile.location_label }} · {{ profile.mobility_label }} · {{ profile.availability_label }}</p>
</div>

<ul class="contact-list">
  <li class="glass-surface"><span class="contact-index" aria-hidden="true">01</span><strong>LinkedIn</strong><p>Professional profile and direct messages.</p><a class="text-link" href="{{ profile.contact.linkedin }}" target="_blank" rel="noopener">Open LinkedIn profile</a></li>
  <li class="glass-surface"><span class="contact-index" aria-hidden="true">02</span><strong>Email</strong><p>Full-time, consulting, and project enquiries.</p><a class="text-link" href="{{ profile.contact.email }}">Email Nina</a></li>
  <li class="glass-surface"><span class="contact-index" aria-hidden="true">03</span><strong>GitHub</strong><p>Technical projects and repository history.</p><a class="text-link" href="{{ profile.contact.github }}" target="_blank" rel="noopener">Open GitHub profile</a></li>
  <li class="glass-surface"><span class="contact-index" aria-hidden="true">04</span><strong>Résumé</strong><p>Public professional résumé in PDF format.</p><a class="text-link" href="{{ profile.contact.resume | relative_url }}" target="_blank" rel="noopener">View résumé (PDF)</a></li>
</ul>
