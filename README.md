# Elon Mode

Elon Mode is a Mac app for planning your day and seeing how much time is left in your current task.

- Add tasks in **Today** and write what you need for each one.
- Give a task a start and end time. The calendar shows your blocks in order.
- The floating timer shows the current scheduled task and counts down to the end of its block. Collapse it to dock near the camera.

For example, add **Read a book**, write **Book and notebook** under Requirements, then schedule it from **9:00 PM** to **10:00 PM**. At 9:15 PM, the floating timer shows **45 minutes left** when the manual timer is idle.

Tasks and blocks are stored locally on your Mac. The app works without an account.

## Run from source

This project is in development. To run it, install Node.js, Rust and the Xcode Command Line Tools. See the [Tauri setup guide](https://v2.tauri.app/start/prerequisites/#macos) for help.

Open Terminal in the cloned repository, in the folder that contains `package.json`, and run:

```bash
npm ci
npm run tauri dev
```

The first command installs the project's dependencies. The second opens the Mac app.

## Credits

Elon Mode builds on [DeepHUD](https://github.com/hktjayaranga/deephud) by Thilina Jayaranga. See the [MIT license](LICENSE).
