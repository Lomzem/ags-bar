# My AGS Bar

Simple AGS Bar

## Installation

### Install Dependencies

```bash
yay -S - < dependencies.txt
```

### Build the Bar

```bash
pnpm build
```

### Install the Bar

```bash
sudo pnpm install-bin
```

Or, simply copy the binary from the `build` to a directory in your `$PATH`:

```bash
cp build/agsbar <directory in $PATH>
```

## Usage

Execute the bar:

```bash
agsbar
```

I recommend adding it to your startup process. For Hyprland, add this
to your `hyprland.conf`:

```hyprlang
exec-once = uwsm app agsbar
```
