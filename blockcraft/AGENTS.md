# BlockCraft Edu 3D - Agent Instructions

## Purpose
This file provides instructions to agents (like Hermes Agent) working on the BlockCraft Edu 3D project. When making changes to the codebase, agents must update the corresponding specification files to reflect the changes.

## Specification Files
The specification files are located in the same directory as this AGENTS.md file. They are:

1. `01_overview_architecture.md` - Overview and architecture of the project
2. `02_quiz_system.md` - Detailed specification of the quiz system
3. `03_voxel_building_system.md` - Voxel and building system specification
4. `04_shop_economy_system.md` - Shop and economy system specification

## Updating Specifications
When making changes to the code, follow these steps:

1. **Identify the affected system(s)**: Determine which of the four systems (quiz, voxel/building, shop/economy, or overall architecture) are impacted by your changes.

2. **Update the relevant specification file(s)**:
   - For changes to the quiz system (e.g., modifying `quiz-data.js`, quiz UI, or quiz logic in `main.js`), update `02_quiz_system.md`.
   - For changes to the voxel engine, block definitions, building/mining mechanics, or world generation, update `03_voxel_building_system.md`.
   - For changes to shop items, prices, availability, economy mechanics, or shop UI, update `04_shop_economy_system.md`.
   - For changes to the overall project structure, file organization, or high-level architecture, update `01_overview_architecture.md`.

3. **Follow the specification format**:
   - Each spec file begins with a level 1 heading (`#`) indicating the system name.
   - Use level 2 headings (`##`) for major sections.
   - Use level 3 headings (`###`) for subsections when needed.
   - Include code snippets where relevant, using triple backticks with the language specified (e.g., ```javascript).
   - Be concise but thorough, focusing on the functional behavior and implementation details.

4. **Verify consistency**:
   - After updating the specification, ensure that it accurately reflects the current state of the code.
   - If you are unsure about any aspect, consult the code in `main.js`, `quiz-data.js`, and other relevant files.

5. **Commit both code and spec changes**:
   - When committing your changes, include both the code modifications and the updated specification file(s) in the same commit.
   - Write a commit message that describes both the code changes and the corresponding spec updates.

## Example
If you add a new block type to the `BLOCKS` array in `main.js`:
1. Identify that this affects the voxel/building system.
2. Open `03_voxel_building_system.md`.
3. Find the "Block Definitions (BLOCKS array)" section and update the description of the BLOCKS array to include the new block.
4. If the new block has special properties (e.g., it's a lesson block), update the "Educational Aspects (Lesson Blocks)" section accordingly.
5. Save the file and commit it along with your changes to `main.js`.

## Notes
- The specification files are the source of truth for the project's design and functionality. Keeping them up to date is crucial for maintaining clarity and enabling effective collaboration.
- If you create a new system that is not covered by the existing four specifications, consult with the team (or follow the project's conventions) to either update an existing spec or create a new one, then add it to this list.

## References
- Main game logic: `main.js`
- Quiz data: `quiz-data.js`
- Styles: `styles.css`
- HTML structure: `index.html`