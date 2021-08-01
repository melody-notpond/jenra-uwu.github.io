---
layout: post
title: 'OS Dev Series Part 1: Bare Bones'
---

Welcome to my new series on developing an operating system from scratch! For this series, we will be targeting the RISC V architecture, which is an open source ISA. I chose this architecture because of three reasons:
 1. Open source stuff is cool.
 2. x86 is a giant mess that I don't want to touch with a 6 foot pole.
 3. I only have experience with RISC V OS dev.

If you wish to develop an OS for x86, you can still follow this tutorial since it will go over concepts and architecture agnostic pieces of code like memory allocation and VIRTIO drivers. Additionally, this tutorial will be using C. If you wish to use another language like Rust or Zig, feel free to do so. I am using C because it is the lingua franca of systems programming, so it makes my tutorial more accessible.

With all that out of the way, let's begin! For this tutorial, you will need the following things:
 - A version of QEMU that supports emulating RISC V
 - A RISC V toolchain
 - Familiarity with your favourite systems level programming language
 - Experience in programming
 - Motivation and dedication!

## QEMU
On Linux and WSL (which I recommend if you're on Windows), QEMU can be installed via your package manager. On macOS, QEMU can be installed via [Homebrew](https://brew.sh).

### Ubuntu/Debian
```
sudo apt-get install qemu qemu-system-misc
```

### Arch Linux
```
sudo pacman -S qemu qemu-arch-extra
```

### Other Linux Distributions
If your Linux distribution is not listed here and you know how to get QEMU for RISC V installed on it, please kindly send a pull request for your distro listing the install instructions.

In case you do not know, you can build QEMU from source as such:
```
git clone --depth 1 --branch v6.0.0 https://github.com/qemu/qemu
cd qemu
./configure --target-list=riscv32-softmmu,riscv64-softmmu
make -j $(nproc)
sudo make install
```

### macOS
Assuming you have [Homebrew](https://brew.sh) installed, you can install QEMU as such:
```
brew install qemu
```

If you do not have homebrew installed, I recommend installing it.

## RISC V Toolchain
If you're not using C, feel free to skip this section. Don't worry, we won't make fun of you in this section for using a better language. ~~*cough* weak *cough*~~

The instructions to follow are found [here](https://github.com/riscv/riscv-gnu-toolchain#installation-newlib), but in case you don't like following links, here are the commands to copy paste:
```
git clone --depth 1 https://github.com/riscv/riscv-gnu-toolchain
./configure --prefix=/opt/riscv
sudo make
```

This will add the toolchain to `/opt/riscv/bin/`, so add this to your path.

## Bare Bones
Let's start by cloning a repo with the following command:
```
git clone --depth 1 https://github.com/jenra-uwu/example-os
```

This repo contains a makefile and linker script (which we won't go into detail), as well as a template OS that prints out `a`.

Let's run it! To compile the code, run `make`, and to run it, run `make run`. You should see some output that looks like this:
```
$ make run
qemu-system-riscv64 -machine virt -cpu rv64 -bios opensbi-riscv64-generic-fw_dynamic.bin -m 256m -nographic -global virtio-mmio.force-legacy=false -s  -kernel kernel

OpenSBI v0.9
   ____                    _____ ____ _____
  / __ \                  / ____|  _ \_   _|
 | |  | |_ __   ___ _ __ | (___ | |_) || |
 | |  | | '_ \ / _ \ '_ \ \___ \|  _ < | |
 | |__| | |_) |  __/ | | |____) | |_) || |_
  \____/| .__/ \___|_| |_|_____/|____/_____|
        | |
        |_|

Platform Name             : riscv-virtio,qemu
Platform Features         : timer,mfdeleg
Platform HART Count       : 1
Firmware Base             : 0x80000000
Firmware Size             : 100 KB
Runtime SBI Version       : 0.2

Domain0 Name              : root
Domain0 Boot HART         : 0
Domain0 HARTs             : 0*
Domain0 Region00          : 0x0000000080000000-0x000000008001ffff ()
Domain0 Region01          : 0x0000000000000000-0xffffffffffffffff (R,W,X)
Domain0 Next Address      : 0x0000000080200000
Domain0 Next Arg1         : 0x000000008f000000
Domain0 Next Mode         : S-mode
Domain0 SysReset          : yes

Boot HART ID              : 0
Boot HART Domain          : root
Boot HART ISA             : rv64imafdcsu
Boot HART Features        : scounteren,mcounteren,time
Boot HART PMP Count       : 16
Boot HART PMP Granularity : 4
Boot HART PMP Address Bits: 54
Boot HART MHPM Count      : 0
Boot HART MHPM Count      : 0
Boot HART MIDELEG         : 0x0000000000000222
Boot HART MEDELEG         : 0x000000000000b109
a
```

Ignore all the OpenSBI stuff. If the program printed out an `a`, then congratulations! You've successfully compiled an operating system!

## Okay, but how does this work? Also how do I exit this thing?
I'm glad you asked! Also, to exit, press <key>ctrl</key>+<key>a</key>, unpress those keys, and then press <key>a</key>. Now that you can use the terminal for a text editor, let's go through the code together! Just don't forget how to exit Vi.

### `src/boot.s`
Let's open up `src/boot.s`. This file contains the code that is first executed in the kernel. This is the file if you're too lazy to open it:
```
.section .text
.global _start

# this is a comment btw
# a0 - current hart id
# a1 - pointer to flattened device tree

_start:
    # Initialise stack pointer

    la sp, stack_top
    mv fp, sp

    j kinit

finish:
    j finish
```

Let's go through this line by line:
#### `.section .text`
This places the code following in the `.text` section. This isn't important to know about, and isn't needed either. I just like putting it there.

#### `.global _start`
This declares the label `_start` as global, which means that other files and the linker can access it.

#### `la sp, stack_top`
`la` stands for "load address"; hence, this psuedoinstruction loads the address `stack_top` into the register `sp`. `sp` is the stack pointer, and `stack_top` is defined in the linker script, which you can take a look at if you'd like. I won't be going over the linker script (mostly because it's unimportant and I don't understand it).

#### `mv fp, sp`
`mv` stands for "move register"; hence, this psuedoinstruction moves the stack pointer into `fp`, which is the frame pointer register. The frame pointer points to the top of the current function's frame, which consists of all of the function's local values.

#### `j kinit`
`j` stands for "jump"; hence, this instruction jumps to the label `kinit`. `kinit` is defined in a separate file (namely `src/kernel.c`). We will go over that function in a second.

#### Other notes
You may have noticed that there are two comments describing what registers `a0` and `a1` correspond to. I shall explain this now.

In RISC V, arguments are passed via registers `a0`-`a7`, and then pushed onto the stack. In this case, there are two arguments being passed along to `kinit`. These register values are provided by OpenSBI, which is the firmware that most RISC V boards run. We will go more in depth with OpenSBI later in this article, but for now, let's take a quick peak at `src/kernel.c`.

### `src/kernel.c`
The contents of `src/kernel.c` is as follows:
```
#include "opensbi.h"

void kinit(unsigned long long hartid, void* fdt) {
    sbi_console_putchar('a');

    while(1);
}
```

The function `kinit` takes in the arguments `hartid` and `fdt`. `hartid` is a fancy word for CPU core and stands for hardware thread. The `hartid` being passed along indicates with hart is executing the boot code. This isn't important now, but it will be when we get around to implementing multicore stuff.

The second argument, `fdt`, stands for flat device tree. This is a pointer to a special data structure that specifies the devices attached to the computer. This isn't important now, but will be when we implement detecting attached devices and assigning drivers to them.

That's it to this file. Now let's get onto the final two files!

### `src/opensbi.{s,h}`
These two files define two functions using the OpenSBI interface. Let's take a look at `opensbi.h` first:
```
#ifndef OPENSBI_H
#define OPENSBI_H

enum {
    SBIRET_ERROR_CODE_SUCCESS               =  0,
    SBIRET_ERROR_CODE_FAILED                = -1,
    SBIRET_ERROR_CODE_UNSUPPORTED           = -2,
    SBIRET_ERROR_CODE_INVALID_PARAMETER     = -3,
    SBIRET_ERROR_CODE_DENIED                = -4,
    SBIRET_ERROR_CODE_INVALID_ADDRESS       = -5,
    SBIRET_ERROR_CODE_ALREADY_AVAILABLE     = -6
};

struct sbiret {
    unsigned long error;
    unsigned long value;
};

// sbi_console_putchar(char) -> void
// Puts a character onto the UART port.
void sbi_console_putchar(char);

// sbi_console_getchar() -> int
// Gets a character from the UART port.
int sbi_console_getchar();

#endif /* OPENSBI_H */
```

This is just your typical C header file, nothing special here. It defines two functions, `sbi_console_putchar` and `sbi_console_getchar`, whose actions are self explanatory.

Here's `opensbi.s`:
```
.section .text

.global sbi_console_putchar
.global sbi_console_getchar

# EIDs are stored in a7
# FIDs are stored in a6

# sbi_console_putchar(char) -> void
# Puts a character onto the UART port.
sbi_console_putchar:
    li a6, 0
    li a7, 1
    ecall
    ret

# sbi_console_getchar() -> int
# Gets a character from the UART port.
sbi_console_getchar:
    li a6, 0
    li a7, 2
    ecall
    ret
```

`sbi_console_getchar` is almost identical to `sbi_console_putchar`, so let's take a closer look at `sbi_console_putchar`. 

`li` stands for "load immediate", and as such it loads an immediate value to the given register. The registers `a0`-`a7` are usually arguments, and they kinda are in this context. However, they are not arguments to a function but to a system call. Let me explain.

In RISC V, there are three privilege levels: machine mode (the highest privilege), supervisor mode, and user mode (the lowest privilege). OpenSBI runs in machine mode, and your kernel runs in supervisor mode. Any processes that your kernel or other processes spawn would run in user mode.
 - In machine mode, the software has unlimited access to hardware and can access information such as timers and hartid registers. It also is not affected by the MMU.
 - In supervisor mode, the software has a more restricted view of the set of registers in the CPU. It also is restricted by the MMU if it is enabled, but the supervisor software can manipulate the MMU.
 - In user mode, the software has the most restricted view of the set of registers in the CPU. If the MMU is enabled in user mode, the software cannot turn it off.

This system adds security by making sure that user processes only deal with their own memory, and gives the kernel nice abstractions of the hardware that it would otherwise have to manage itself. It also makes the kernel more secure and easier to debug if you enable the MMU by making sure memory accesses outside of the registered pieces of memory correspond to page faults.

So that being said, what does the `ecall` instruction do? Well, it causes a software interrupt; ie, a syscall. This makes a jump from supervisor mode to machine mode (or user mode to supervisor mode if in user mode) according to the interrupt vector. We will discuss interrupts in more detail later.

The `ret` instruction jumps to the instruction after the place where the function is called, which is stored in the `ra` (return address) register. If multiple nested function calls occurred, then the previous return address is pushed onto the stack before calling the next function. And that's it! You now understand the entirety of a bare metal codebase!

## Conclusion
That's it! That's the bare bones of a RISC V operating system! If you're impatient and willing to grind through documents, you can implement the rest of the OS by reading specs, but if you want some more help, stay tuned for more tutorials in this series! Feel free to reach out to me on Matrix or Mastodon for help! (See the [about page](/about) for information on contacting me.)

### Homework
Ahahaha, you didn't think you'd leave this article without practice problems, did you? Now that you have read the whole article, you are legally obligated to complete the following homework assignments:
 1. Implement `puts` and write a simple hello world program for your os.
 2. Implement a `printf` function.
 3. Implement a simple hexdump function.
 4. Make your hexdump function pretty. By pretty, I mean looking something like this:
    ```
    00    68 65 77 77 6f 20 77 6f 77 77 64 20 6a 62 73 64     |hewwo wowwd jbsd|
    10    66 6e 20 6b 6a 6e 62 6a 66 64 20 73 6e 62 20 6a     |fn kjnbjfd snb j|
    20    6b 66 64 6e 73 20 6a 62 6b 6e 64 66 20 6a 73 62     |kfdns jbkndf jsb|
    30    6e 20 6a 6b 66 64 73 6e 20 62 6a 6b 66 64 20 6e     |n jkfdsn bjkfd n|
    40    62 6a 6b 20 6e                                      |bjk n...........|
    ```

    It helps to have `printf` implemented first, but you can get away with just some `put_hex` and `puts` functions instead.

That's it for now, and stay tuned for the next tutorial in this series!
