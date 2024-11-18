import * as d3 from 'd3';
import * as d3Sankey from "d3-sankey";

const width = 928;
const height = 600;
const format = d3.format(",.0f");
const linkColor = "source-target"; // source, target, source-target, or a color string.

// Create a SVG container.
const svg = d3.create("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height])
  .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

// Constructs and configures a Sankey generator.
const sankey = d3Sankey.sankey()
  .nodeId(d => d.name)
  .nodeAlign(d3Sankey.sankeyJustify) // d3.sankeyLeft, etc.
  .nodeWidth(15)
  .nodePadding(10)
  .extent([[1, 5], [width - 1, height - 5]]);


function linksFromJMU(dataset) {

}


function nodesFromJMU(dataset) {

  const nodes = [
    { id: "JMU Student", label: "JMU Student" },
    { id: "Fall", label: "Fall" },
    { id: "Spring", label: "Spring" },

    ...dataSet.map(item => ({
      id: item.name,        
      label: item.name    
    }))
  ];
  //   1. leftmost nodes: JMU (positive) Revenue items
  const jmuIncomeItems = incomeItems(dataset); // assume returns an array

  // 1. second-to-leftmost nodes: JMU Revenue Categories (e.g. operating revenues, non-operating revenues, etc.)
  const jmuIncomeCatagory = incomeCategories(dataset);

  // 1. center node: JMU 
  const jmuCenterNode = totalCategories(dataset);// what goes here
  // 1. second-to-rightmost nodes: JMU Expense (negative revenue) Categories (e.g. operating expenses)
  const jmuOperatingExpenseCategory = operatingCategory(dataset);
  // 1. rightmost nodes: JMU Expense items (e.g. Instruction, Research, etc.)
  const jmuItemsExpenseCategory = itemsCategory(dataset);
  return [
    ...jmuIncomeItems, // ... means this thing is collection, make individual items
    ...jmuIncomeCatagory,
    ...jmuCenterNode,
    ...jmuOperatingExpenseCategory,
    ...jmuItemsExpenseCategory
  ];
}

// all function definitions defined before they can get called
// function hoisting
function nodesLinksFromJMU(dataSet) {
  // return an object
  // with 2 keys: nodes and links
  const dataset = data["jmu-athletics"]; // NOT array, variable named differently
  const results = {
    nodes: nodesFromJMU(dataset),
    links: linksFromJMU(dataset)
  }
}

async function init() {
  // const data = await d3.json("data/data_sankey.json");
  const dataJMU = await d3.json("data/jmu.json"); // read the file we care about
  const data = nodesLinksFromJMU(dataJMU);
  // Applies it to the data. We make a copy of the nodes and links objects
  // so as to avoid mutating the original.
  const { studentCosts, studentAux, jmuRevenues, jmuAthletics } = sankey({
    nodes: data.nodes.map(d => ({
      id: d.id,
      name: d.name,
      category: d.category || 'general', // Adding an extra category
      value: d.value           // Add more values if needed
    })),
    links: data.links.map(d => ({
      sourceIndex: d.source,
      targetIndex: d.target,
      flowValue: d.flow || 0,
      label: d.label || 'Unknown'
    }))
  });
  

  // console.log('tmp', tmp);
  console.log('nodes', nodes);
  console.log('links', links);

  // Defines a color scale.
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Creates the rects that represent the nodes.
  const rect = svg.append("g")
    .attr("stroke", "#000")
    .selectAll()
    .data(nodes)
    .join("rect")
    .attr("x", d => d.x0)
    .attr("y", d => d.y0)
    .attr("height", d => d.y1 - d.y0)
    .attr("width", d => d.x1 - d.x0)
    .attr("fill", d => color(d.category));

  // Adds a title on the nodes.
  rect.append("title")
    .text(d => {
      console.log('d', d);
      return `${d.name}\n${format(d.value)}`});

  // Creates the paths that represent the links.
  const link = svg.append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll()
    .data(links)
    .join("g")
    .style("mix-blend-mode", "multiply");

  // Creates a gradient, if necessary, for the source-target color option.
  if (linkColor === "source-target") {
    const gradient = link.append("linearGradient")
      .attr("id", d => (d.uid = `link-${d.index}`))
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", d => d.source.x1)
      .attr("x2", d => d.target.x0);
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", d => color(d.source.category));
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", d => color(d.target.category));
  }

  link.append("path")
    .attr("d", d3Sankey.sankeyLinkHorizontal())
    .attr("stroke", linkColor === "source-target" ? (d) => `url(#${d.uid})`
      : linkColor === "source" ? (d) => color(d.source.category)
        : linkColor === "target" ? (d) => color(d.target.category)
          : linkColor)
    .attr("stroke-width", d => Math.max(1, d.width));

  link.append("title")
    .text(d => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

  // Adds labels on the nodes.
  svg.append("g")
    .selectAll()
    .data(nodes)
    .join("text")
    .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => d.title);

    // Adds labels on the links.
  svg.append("g")
    .selectAll()
    .data(links)
    .join("text")
    .attr("x", d => {
      console.log('linkd', d)
      const midX = (d.source.x1 + d.target.x0) / 2;
      return midX < width / 2 ? midX + 6 : midX - 6
    })
    .attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
    .text(d => {
      console.log('linkd', d);
      return `${d.source.title} → ${d.value} → ${d.target.title}`
    });

  const svgNode = svg.node();
    document.body.appendChild(svgNode);
  return svgNode;
}

init();