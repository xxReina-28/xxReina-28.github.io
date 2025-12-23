/* =========================================
   CREDENTIALS SECTION – SECONDARY VISUAL WEIGHT
   ========================================= */

.section .project-grid .card.project-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Slightly de-emphasize credentials cards */
.section:last-of-type .project-grid .project-card {
  padding: 1.25rem;
  font-size: 0.95rem;
  opacity: 0.9;
}

/* Titles smaller than project titles */
.section:last-of-type .project-grid .project-card h3 {
  font-size: 1.05rem;
  margin-bottom: 0.25rem;
}

/* Badges slightly muted */
.section:last-of-type .project-grid .badge {
  font-size: 0.7rem;
  opacity: 0.85;
}

/* Gentle hover, not aggressive */
.section:last-of-type .project-grid .project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}
