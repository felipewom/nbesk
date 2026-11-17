#!/usr/bin/env node
// Check the runtime before evaluating dependencies with newer Node requirements.
const [majorVersion, minorVersion] = process.versions.node.split(".").map(Number);
if (majorVersion < 22 || (majorVersion === 22 && minorVersion < 13) ||
    (majorVersion === 23 && minorVersion < 5)) {
  console.error("Please install Node.js 22.13+ (or 23.5+ on the Node.js 23 line)");
  process.exit(1);
}

const { program } = await import("commander");
const { default: fs } = await import("fs-extra");
const { default: path } = await import("node:path");
const { execSync } = await import("node:child_process");
const { default: kleur } = await import("kleur");

const templateDir = path.resolve(
  path.dirname(import.meta.url).replace("file://", ""),
  "be-template",
);

program
  .name("nbesk")
  .version("1.0.0")
  .description("CLI tool for creating a new NodeJS project from a template");

program
  .command("create <project-name>")
  .alias("c")
  .description("Create a new project")
  .action((projectName) => {
    console.log(
      kleur.yellow(`⏳ Creating a new project named '${projectName}'`),
    );
    // copy the template to the new project
    fs.copySync(templateDir, projectName);
    // check emoticon html entity
    console.log(kleur.green("✅ Template copied successfully!"));
    // replace the placeholder with the project name
    const packageJsonPath = path.resolve(projectName, "package.json");
    const packageJson = fs.readJsonSync(packageJsonPath);
    packageJson.name = projectName;
    fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 2 });
    console.log(kleur.green("✅ Project name updated in package.json"));
    // replace inside folder everything {{application-name}} with the project name
    const files = fs.readdirSync(projectName);
    files.forEach((file) => {
      // if the file is a directory, skip it
      if (fs.lstatSync(path.resolve(projectName, file)).isDirectory()) {
        return;
      }
      const filePath = path.resolve(projectName, file);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const newFileContent = fileContent.replace(
        /{{application-name}}/g,
        projectName,
      );
      fs.writeFileSync(filePath, newFileContent);
    });
    // install the dependencies
    console.log(kleur.yellow("⏳ Installing dependencies..."));
    execSync(`cd ${projectName} && npm install`, { stdio: "inherit" });
    console.log(kleur.green("✅ Dependencies installed successfully!"));
    // initialize a new git repository
    console.log(kleur.yellow("⏳ Initializing a new git repository..."));
    execSync(`cd ${projectName} && git init`, { stdio: "inherit" });
    console.log(kleur.green("✅ Git repository initialized successfully!"));
    console.log(kleur.green("🚀 Project created successfully!"));
  });

program.parse(process.argv);
