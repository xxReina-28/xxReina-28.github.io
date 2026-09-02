---
layout: page
title: "Work"
description: "Selected work currently represented in the portfolio."
permalink: /work/
---

{% assign approved_projects = site.projects | where: 'status', 'approved' %}
{% if approved_projects.size > 0 %}
  <div class="project-grid">
    {% for project in approved_projects %}
      {% include work-card.html item=project %}
    {% endfor %}
  </div>
{% endif %}
