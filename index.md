---
layout: default
---
{% assign profile = site.data.profile %}
{% assign homepage = site.data.homepage %}

<section class="section hero-section" aria-labelledby="hero-heading">
  <div class="profile card">
    <img src="{{ '/assets/img/profile.jpg' | relative_url }}" alt="Portrait of Nina Suico" class="avatar" width="120" height="120" />
    <div>
      <p class="eyebrow">{{ profile.role }}</p>
      <h1 id="hero-heading">{{ profile.value_proposition }}</h1>
      <p class="lead">{{ profile.supporting_statement }}</p>
      <p>{{ profile.market_context }}</p>
      <p class="muted">{{ profile.location_label }} · {{ profile.mobility_label }} · {{ profile.availability_label }}</p>
      <div class="btn-row">
        <a class="btn" href="{{ '/work/' | relative_url }}">View selected work</a>
        <a class="btn btn-ghost" href="{{ '/contact/' | relative_url }}">Contact Nina</a>
        <a class="btn btn-ghost" href="{{ profile.contact.resume | relative_url }}" target="_blank" rel="noopener">View résumé (PDF)</a>
      </div>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="problems-heading">
  <h2 id="problems-heading" class="section-title">{{ homepage.problems_heading }}</h2>
  <ul class="problem-grid">
    {% for problem in homepage.problems %}<li class="card">{{ problem }}</li>{% endfor %}
  </ul>
</section>

<section class="section" aria-labelledby="capabilities-heading">
  <h2 id="capabilities-heading" class="section-title">Three Capability Pillars</h2>
  <div class="grid grid-3">
    {% for capability in site.data.capabilities %}
      {% include capability-card.html capability=capability %}
    {% endfor %}
  </div>
</section>

<section class="section" aria-labelledby="work-heading">
  <div class="section-heading-row">
    <h2 id="work-heading" class="section-title">Selected Work</h2>
    <a href="{{ '/work/' | relative_url }}">View all work</a>
  </div>
  {% include work-grid.html featured_only=true case_studies_only=true %}
</section>

<section class="section" aria-labelledby="approach-heading">
  <h2 id="approach-heading" class="section-title">{{ homepage.how_i_work_heading }}</h2>
  <div class="grid grid-3">
    {% for item in homepage.how_i_work %}
      <article class="card">
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </article>
    {% endfor %}
  </div>
</section>

<section class="section" aria-labelledby="about-heading">
  <div class="card">
    <h2 id="about-heading">{{ homepage.about_heading }}</h2>
    <p>{{ homepage.about_summary }}</p>
    <a href="{{ '/about/' | relative_url }}">Read the professional narrative</a>
  </div>
</section>

<section class="section" aria-labelledby="credentials-heading">
  <h2 id="credentials-heading" class="section-title">Credentials</h2>
  <div class="card">
    <ul class="credential-list">
      {% for credential in site.data.credentials %}
        {% include credential-item.html credential=credential %}
      {% endfor %}
    </ul>
  </div>
</section>

{% assign contact_cta = site.data.ctas.items | where: 'id', 'contact' | first %}
{% include cta-block.html cta=contact_cta %}
