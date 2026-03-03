---
title: "Home"
description: "Welcome to the barnacle demo site."
pagegraph:
  id: "00000000-0000-4000-a000-000000000001"
  version: "1"
  meta:
    title: "Home"
    slug: "home"
    lang: "en"
    description: "Welcome to the barnacle demo site."
  nodes:
    - id: "section-hero"
      type: "section"
      props: {}
      children:
        - "heading-hero"
        - "para-hero"
        - "btn-hero"
      styleRefs:
        - "style-hero"
      parentId: null
    - id: "heading-hero"
      type: "heading"
      props:
        level: 1
        text: "Welcome to Barnacle"
      children: []
      styleRefs: []
      parentId: "section-hero"
    - id: "para-hero"
      type: "paragraph"
      props:
        text: "A static-first visual CMS. Build pages with a composable node graph — no runtime required."
      children: []
      styleRefs: []
      parentId: "section-hero"
    - id: "btn-hero"
      type: "button"
      props:
        label: "Learn more"
        href: "/about/"
      children: []
      styleRefs: []
      parentId: "section-hero"
    - id: "divider-1"
      type: "divider"
      props: {}
      children: []
      styleRefs: []
      parentId: null
  styles:
    style-hero:
      id: "style-hero"
      className: "hero-section"
      css:
        padding: "4rem 1rem"
        textAlign: "center"
        background: "#f5f5f5"
  assets: {}
---
