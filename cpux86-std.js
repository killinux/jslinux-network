/*
   PC Emulator

   Copyright (c) 2011 Fabrice Bellard

   Redistribution or commercial use is prohibited without the author's
   permission.
*/
"use strict";
var aa = [1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1];
var ba = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
var ca = [0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4];

function CPU_X86() {
    var i, da;
    this.regs = new Array();
    for (i = 0; i < 8; i++) this.regs[i] = 0;
    this.eip = 0;
    this.cc_op = 0;
    this.cc_dst = 0;
    this.cc_src = 0;
    this.cc_op2 = 0;
    this.cc_dst2 = 0;
    this.df = 1;
    this.eflags = 0x2;
    this.cycle_count = 0;
    this.hard_irq = 0;
    this.hard_intno = -1;
    this.cpl = 0;
    this.cr0 = (1 << 0);
    this.cr2 = 0;
    this.cr3 = 0;
    this.cr4 = 0;
    this.idt = {
        base: 0,
        limit: 0
    };
    this.gdt = {
        base: 0,
        limit: 0
    };
    this.segs = new Array();
    for (i = 0; i < 7; i++) {
        this.segs[i] = {
            selector: 0,
            base: 0,
            limit: 0,
            flags: 0
        };
    }
    this.segs[2].flags = (1 << 22);
    this.segs[1].flags = (1 << 22);
    this.tr = {
        selector: 0,
        base: 0,
        limit: 0,
        flags: 0
    };
    this.ldt = {
        selector: 0,
        base: 0,
        limit: 0,
        flags: 0
    };
    this.halted = 0;
    this.phys_mem = null;
    da = 0x100000;
    this.tlb_read_kernel = new Array();
    this.tlb_write_kernel = new Array();
    this.tlb_read_user = new Array();
    this.tlb_write_user = new Array();
    for (i = 0; i < da; i++) {
        this.tlb_read_kernel[i] = -1;
        this.tlb_write_kernel[i] = -1;
        this.tlb_read_user[i] = -1;
        this.tlb_write_user[i] = -1;
    }
    this.tlb_pages = new Array();
    for (i = 0; i < 2048; i++) this.tlb_pages[i] = 0;
    this.tlb_pages_count = 0;
}
CPU_X86.prototype.phys_mem_resize = function (ea) {
    this.mem_size = ea;
    ea += ((15 + 3) & ~3);
    var i, fa, ga, ha;
    this.phys_mem8 = null;
    ha = document.getElementById("dummy_canvas");
    if (ha && ha.getContext) {
        ga = ha.getContext("2d");
        if (ga && ga.createImageData) {
            this.phys_mem8 = ga.createImageData(1024, (ea + 4095) >> 12).data;
        }
    }
    if (!this.phys_mem8) {
        fa = this.phys_mem8 = new Array();
        for (i = 0; i < ea; i++) fa[i] = 0;
    }
};
CPU_X86.prototype.ld8_phys = function (ia) {
    return this.phys_mem8[ia];
};
CPU_X86.prototype.st8_phys = function (ia, ja) {
    this.phys_mem8[ia] = ja & 0xff;
};
CPU_X86.prototype.ld32_phys = function (ia) {
    return this.phys_mem8[ia] | (this.phys_mem8[ia + 1] << 8) | (this.phys_mem8[ia + 2] << 16) | (this.phys_mem8[ia + 3] << 24);
};
CPU_X86.prototype.st32_phys = function (ia, ja) {
    this.phys_mem8[ia] = ja & 0xff;
    this.phys_mem8[ia + 1] = (ja >> 8) & 0xff;
    this.phys_mem8[ia + 2] = (ja >> 16) & 0xff;
    this.phys_mem8[ia + 3] = (ja >> 24) & 0xff;
};
CPU_X86.prototype.tlb_set_page = function (ia, ka, la, ma) {
    var i, ja, j;
    ka &= -4096;
    ia &= -4096;
    ja = ia ^ ka;
    i = ia >>> 12;
    if (this.tlb_read_kernel[i] == -1) {
        if (this.tlb_pages_count >= 2048) {
            this.tlb_flush_all1((i - 1) & 0xfffff);
        }
        this.tlb_pages[this.tlb_pages_count++] = i;
    }
    this.tlb_read_kernel[i] = ja;
    if (la) {
        this.tlb_write_kernel[i] = ja;
    } else {
        this.tlb_write_kernel[i] = -1;
    } if (ma) {
        this.tlb_read_user[i] = ja;
        if (la) {
            this.tlb_write_user[i] = ja;
        } else {
            this.tlb_write_user[i] = -1;
        }
    } else {
        this.tlb_read_user[i] = -1;
        this.tlb_write_user[i] = -1;
    }
};
CPU_X86.prototype.tlb_flush_page = function (ia) {
    var i;
    i = ia >>> 12;
    this.tlb_read_kernel[i] = -1;
    this.tlb_write_kernel[i] = -1;
    this.tlb_read_user[i] = -1;
    this.tlb_write_user[i] = -1;
};
CPU_X86.prototype.tlb_flush_all = function () {
    var i, j, n, na;
    na = this.tlb_pages;
    n = this.tlb_pages_count;
    for (j = 0; j < n; j++) {
        i = na[j];
        this.tlb_read_kernel[i] = -1;
        this.tlb_write_kernel[i] = -1;
        this.tlb_read_user[i] = -1;
        this.tlb_write_user[i] = -1;
    }
    this.tlb_pages_count = 0;
};
CPU_X86.prototype.tlb_flush_all1 = function (oa) {
    var i, j, n, na, pa;
    na = this.tlb_pages;
    n = this.tlb_pages_count;
    pa = 0;
    for (j = 0; j < n; j++) {
        i = na[j];
        if (i == oa) {
            na[pa++] = i;
        } else {
            this.tlb_read_kernel[i] = -1;
            this.tlb_write_kernel[i] = -1;
            this.tlb_read_user[i] = -1;
            this.tlb_write_user[i] = -1;
        }
    }
    this.tlb_pages_count = pa;
};
CPU_X86.prototype.write_string = function (ia, qa) {
    var i;
    for (i = 0; i < qa.length; i++) {
        this.st8_phys(ia++, qa.charCodeAt(i) & 0xff);
    }
    this.st8_phys(ia, 0);
};

function ra(ja, n) {
    var i, s;
    var h = "0123456789ABCDEF";
    s = "";
    for (i = n - 1; i >= 0; i--) {
        s = s + h[(ja >>> (i * 4)) & 15];
    }
    return s;
}

function sa(n) {
    return ra(n, 8);
}

function ta(n) {
    return ra(n, 2);
}

function ua(n) {
    return ra(n, 4);
}
CPU_X86.prototype.dump_short = function () {
    console.log(" EIP=" + sa(this.eip) + " EAX=" + sa(this.regs[0]) + " ECX=" + sa(this.regs[1]) + " EDX=" + sa(this.regs[2]) + " EBX=" + sa(this.regs[3]));
    console.log("EFL=" + sa(this.eflags) + " ESP=" + sa(this.regs[4]) + " EBP=" + sa(this.regs[5]) + " ESI=" + sa(this.regs[6]) + " EDI=" + sa(this.regs[7]));
};
CPU_X86.prototype.dump = function () {
    var i, va, qa;
    var wa = [" ES", " CS", " SS", " DS", " FS", " GS", "LDT", " TR"];
    this.dump_short();
    console.log("TSC=" + sa(this.cycle_count) + " OP=" + ta(this.cc_op) + " SRC=" + sa(this.cc_src) + " DST=" + sa(this.cc_dst) + " OP2=" + ta(this.cc_op2) + " DST2=" + sa(this.cc_dst2));
    console.log("CPL=" + this.cpl + " CR0=" + sa(this.cr0) + " CR2=" + sa(this.cr2) + " CR3=" + sa(this.cr3) + " CR4=" + sa(this.cr4));
    qa = "";
    for (i = 0; i < 8; i++) {
        if (i == 6) va = this.ldt;
        else if (i == 7) va = this.tr;
        else va = this.segs[i];
        qa += wa[i] + "=" + ua(va.selector) + " " + sa(va.base) + " " + sa(va.limit) + " " + ua((va.flags >> 8) & 0xf0ff);
        if (i & 1) {
            console.log(qa);
            qa = "";
        } else {
            qa += " ";
        }
    }
    va = this.gdt;
    qa = "GDT=     " + sa(va.base) + " " + sa(va.limit) + "      ";
    va = this.idt;
    qa += "IDT=     " + sa(va.base) + " " + sa(va.limit);
    console.log(qa);
};
CPU_X86.prototype.exec_internal = function (xa, ya) {
    var za, ia, Aa;
    var Ba, Ca, Da, Ea, Fa;
    var Ga, Ha, Ia, b, Ja, ja, Ka, La, Ma, Na, Oa, Pa;
    var Qa, Ra, Sa, Ta, Ua, Va;
    var Wa, Xa;
    var Ya, Za, ab, bb, cb, db;

    function eb() {
        var fb;
        gb(ia, 0, za.cpl == 3);
        fb = cb[ia >>> 12] ^ ia;
        return Wa[fb];
    }

    function hb() {
        var Xa;
        return (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
    }

    function ib() {
        var ja;
        ja = hb();
        ia++;
        ja |= hb() << 8;
        ia--;
        return ja;
    }

    function jb() {
        var Xa;
        return (((Xa = cb[ia >>> 12]) | ia) & 1 ? ib() : (Xa ^= ia, Wa[Xa] | (Wa[Xa + 1] << 8)));
    }

    function kb() {
        var ja;
        ja = hb();
        ia++;
        ja |= hb() << 8;
        ia++;
        ja |= hb() << 16;
        ia++;
        ja |= hb() << 24;
        ia -= 3;
        return ja;
    }

    function lb() {
        var Xa;
        return (((Xa = cb[ia >>> 12]) | ia) & 3 ? kb() : (Xa ^= ia, Wa[Xa] | (Wa[Xa + 1] << 8) | (Wa[Xa + 2] << 16) | (Wa[Xa + 3] << 24)));
    }

    function mb() {
        var fb;
        gb(ia, 1, za.cpl == 3);
        fb = db[ia >>> 12] ^ ia;
        return Wa[fb];
    }

    function nb() {
        var fb;
        return ((fb = db[ia >>> 12]) == -1) ? mb() : Wa[ia ^ fb];
    }

    function ob() {
        var ja;
        ja = nb();
        ia++;
        ja |= nb() << 8;
        ia--;
        return ja;
    }

    function pb() {
        var fb;
        return ((fb = db[ia >>> 12]) | ia) & 1 ? ob() : (fb ^= ia, Wa[fb] | (Wa[fb + 1] << 8));
    }

    function qb() {
        var ja;
        ja = nb();
        ia++;
        ja |= nb() << 8;
        ia++;
        ja |= nb() << 16;
        ia++;
        ja |= nb() << 24;
        ia -= 3;
        return ja;
    }

    function rb() {
        var fb;
        return ((fb = db[ia >>> 12]) | ia) & 3 ? qb() : (fb ^= ia, Wa[fb] | (Wa[fb + 1] << 8) | (Wa[fb + 2] << 16) | (Wa[fb + 3] << 24));
    }

    function sb(ja) {
        var fb;
        gb(ia, 1, za.cpl == 3);
        fb = db[ia >>> 12] ^ ia;
        Wa[fb] = ja & 0xff;
    }

    function tb(ja) {
        var Xa; {
            Xa = db[ia >>> 12];
            if (Xa == -1) {
                sb(ja);
            } else {
                Wa[ia ^ Xa] = ja & 0xff;
            }
        };
    }

    function ub(ja) {
        tb(ja);
        ia++;
        tb(ja >> 8);
        ia--;
    }

    function vb(ja) {
        var Xa; {
            Xa = db[ia >>> 12];
            if ((Xa | ia) & 1) {
                ub(ja);
            } else {
                Xa ^= ia;
                Wa[Xa] = ja & 0xff;
                Wa[Xa + 1] = (ja >> 8) & 0xff;
            }
        };
    }

    function wb(ja) {
        tb(ja);
        ia++;
        tb(ja >> 8);
        ia++;
        tb(ja >> 16);
        ia++;
        tb(ja >> 24);
        ia -= 3;
    }

    function xb(ja) {
        var Xa; {
            Xa = db[ia >>> 12];
            if ((Xa | ia) & 3) {
                wb(ja);
            } else {
                Xa ^= ia;
                Wa[Xa] = ja & 0xff;
                Wa[Xa + 1] = (ja >> 8) & 0xff;
                Wa[Xa + 2] = (ja >> 16) & 0xff;
                Wa[Xa + 3] = (ja >> 24) & 0xff;
            }
        };
    }

    function yb() {
        var fb;
        gb(ia, 0, 0);
        fb = Ya[ia >>> 12] ^ ia;
        return Wa[fb];
    }

    function zb() {
        var fb;
        return ((fb = Ya[ia >>> 12]) == -1) ? yb() : Wa[ia ^ fb];
    }

    function Ab() {
        var ja;
        ja = zb();
        ia++;
        ja |= zb() << 8;
        ia--;
        return ja;
    }

    function Bb() {
        var fb;
        return ((fb = Ya[ia >>> 12]) | ia) & 1 ? Ab() : (fb ^= ia, Wa[fb] | (Wa[fb + 1] << 8));
    }

    function Cb() {
        var ja;
        ja = zb();
        ia++;
        ja |= zb() << 8;
        ia++;
        ja |= zb() << 16;
        ia++;
        ja |= zb() << 24;
        ia -= 3;
        return ja;
    }

    function Db() {
        var fb;
        return ((fb = Ya[ia >>> 12]) | ia) & 3 ? Cb() : (fb ^= ia, Wa[fb] | (Wa[fb + 1] << 8) | (Wa[fb + 2] << 16) | (Wa[fb + 3] << 24));
    }

    function Eb(ja) {
        var fb;
        gb(ia, 1, 0);
        fb = Za[ia >>> 12] ^ ia;
        Wa[fb] = ja & 0xff;
    }

    function Fb(ja) {
        var fb;
        fb = Za[ia >>> 12];
        if (fb == -1) {
            Eb(ja);
        } else {
            Wa[ia ^ fb] = ja & 0xff;
        }
    }

    function Gb(ja) {
        Fb(ja);
        ia++;
        Fb(ja >> 8);
        ia--;
    }

    function Hb(ja) {
        var fb;
        fb = Za[ia >>> 12];
        if ((fb | ia) & 1) {
            Gb(ja);
        } else {
            fb ^= ia;
            Wa[fb] = ja & 0xff;
            Wa[fb + 1] = (ja >> 8) & 0xff;
        }
    }

    function Ib(ja) {
        Fb(ja);
        ia++;
        Fb(ja >> 8);
        ia++;
        Fb(ja >> 16);
        ia++;
        Fb(ja >> 24);
        ia -= 3;
    }

    function Jb(ja) {
        var fb;
        fb = Za[ia >>> 12];
        if ((fb | ia) & 3) {
            Ib(ja);
        } else {
            fb ^= ia;
            Wa[fb] = ja & 0xff;
            Wa[fb + 1] = (ja >> 8) & 0xff;
            Wa[fb + 2] = (ja >> 16) & 0xff;
            Wa[fb + 3] = (ja >> 24) & 0xff;
        }
    }
    var Kb, Lb, Mb, Nb, Ob;

    function Pb() {
        var ja, Ka;
        ja = Wa[Lb++];;
        Ka = Wa[Lb++];;
        return ja | (Ka << 8);
    }

    function Qb(Ha) {
        var base, ia, Rb, Sb, Tb, Ub;
        if (Ta && (Ga & (0x000f | 0x0080)) == 0) {
            switch ((Ha & 7) | ((Ha >> 3) & 0x18)) {
            case 0x04:
                Rb = Wa[Lb++];;
                base = Rb & 7;
                if (base == 5) {
                    {
                        ia = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                        Lb += 4;
                    };
                } else {
                    ia = Aa[base];
                }
                Sb = (Rb >> 3) & 7;
                if (Sb != 4) {
                    ia = (ia + (Aa[Sb] << (Rb >> 6))) >> 0;
                }
                break;
            case 0x0c:
                Rb = Wa[Lb++];;
                ia = ((Wa[Lb++] << 24) >> 24);;
                base = Rb & 7;
                ia = (ia + Aa[base]) >> 0;
                Sb = (Rb >> 3) & 7;
                if (Sb != 4) {
                    ia = (ia + (Aa[Sb] << (Rb >> 6))) >> 0;
                }
                break;
            case 0x14:
                Rb = Wa[Lb++];; {
                    ia = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                base = Rb & 7;
                ia = (ia + Aa[base]) >> 0;
                Sb = (Rb >> 3) & 7;
                if (Sb != 4) {
                    ia = (ia + (Aa[Sb] << (Rb >> 6))) >> 0;
                }
                break;
            case 0x05:
                {
                    ia = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                break;
            case 0x00:
            case 0x01:
            case 0x02:
            case 0x03:
            case 0x06:
            case 0x07:
                base = Ha & 7;
                ia = Aa[base];
                break;
            case 0x08:
            case 0x09:
            case 0x0a:
            case 0x0b:
            case 0x0d:
            case 0x0e:
            case 0x0f:
                ia = ((Wa[Lb++] << 24) >> 24);;
                base = Ha & 7;
                ia = (ia + Aa[base]) >> 0;
                break;
            case 0x10:
            case 0x11:
            case 0x12:
            case 0x13:
            case 0x15:
            case 0x16:
            case 0x17:
            default:
                {
                    ia = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                base = Ha & 7;
                ia = (ia + Aa[base]) >> 0;
                break;
            }
            return ia;
        } else if (Ga & 0x0080) {
            if ((Ha & 0xc7) == 0x06) {
                ia = Pb();
                Ub = 3;
            } else {
                switch (Ha >> 6) {
                case 0:
                    ia = 0;
                    break;
                case 1:
                    ia = ((Wa[Lb++] << 24) >> 24);;
                    break;
                default:
                    ia = Pb();
                    break;
                }
                switch (Ha & 7) {
                case 0:
                    ia = (ia + Aa[3] + Aa[6]) & 0xffff;
                    Ub = 3;
                    break;
                case 1:
                    ia = (ia + Aa[3] + Aa[7]) & 0xffff;
                    Ub = 3;
                    break;
                case 2:
                    ia = (ia + Aa[5] + Aa[6]) & 0xffff;
                    Ub = 2;
                    break;
                case 3:
                    ia = (ia + Aa[5] + Aa[7]) & 0xffff;
                    Ub = 2;
                    break;
                case 4:
                    ia = (ia + Aa[6]) & 0xffff;
                    Ub = 3;
                    break;
                case 5:
                    ia = (ia + Aa[7]) & 0xffff;
                    Ub = 3;
                    break;
                case 6:
                    ia = (ia + Aa[5]) & 0xffff;
                    Ub = 2;
                    break;
                case 7:
                default:
                    ia = (ia + Aa[3]) & 0xffff;
                    Ub = 3;
                    break;
                }
            }
            Tb = Ga & 0x000f;
            if (Tb == 0) {
                Tb = Ub;
            } else {
                Tb--;
            }
            ia = (ia + za.segs[Tb].base) >> 0;
            return ia;
        } else {
            switch ((Ha & 7) | ((Ha >> 3) & 0x18)) {
            case 0x04:
                Rb = Wa[Lb++];;
                base = Rb & 7;
                if (base == 5) {
                    {
                        ia = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                        Lb += 4;
                    };
                    base = 0;
                } else {
                    ia = Aa[base];
                }
                Sb = (Rb >> 3) & 7;
                if (Sb != 4) {
                    ia = (ia + (Aa[Sb] << (Rb >> 6))) >> 0;
                }
                break;
            case 0x0c:
                Rb = Wa[Lb++];;
                ia = ((Wa[Lb++] << 24) >> 24);;
                base = Rb & 7;
                ia = (ia + Aa[base]) >> 0;
                Sb = (Rb >> 3) & 7;
                if (Sb != 4) {
                    ia = (ia + (Aa[Sb] << (Rb >> 6))) >> 0;
                }
                break;
            case 0x14:
                Rb = Wa[Lb++];; {
                    ia = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                base = Rb & 7;
                ia = (ia + Aa[base]) >> 0;
                Sb = (Rb >> 3) & 7;
                if (Sb != 4) {
                    ia = (ia + (Aa[Sb] << (Rb >> 6))) >> 0;
                }
                break;
            case 0x05:
                {
                    ia = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                base = 0;
                break;
            case 0x00:
            case 0x01:
            case 0x02:
            case 0x03:
            case 0x06:
            case 0x07:
                base = Ha & 7;
                ia = Aa[base];
                break;
            case 0x08:
            case 0x09:
            case 0x0a:
            case 0x0b:
            case 0x0d:
            case 0x0e:
            case 0x0f:
                ia = ((Wa[Lb++] << 24) >> 24);;
                base = Ha & 7;
                ia = (ia + Aa[base]) >> 0;
                break;
            case 0x10:
            case 0x11:
            case 0x12:
            case 0x13:
            case 0x15:
            case 0x16:
            case 0x17:
            default:
                {
                    ia = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                base = Ha & 7;
                ia = (ia + Aa[base]) >> 0;
                break;
            }
            Tb = Ga & 0x000f;
            if (Tb == 0) {
                if (base == 4 || base == 5) Tb = 2;
                else Tb = 3;
            } else {
                Tb--;
            }
            ia = (ia + za.segs[Tb].base) >> 0;
            return ia;
        }
    }

    function Vb() {
        var ia, Tb;
        if (Ga & 0x0080) {
            ia = Pb();
        } else {
            {
                ia = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                Lb += 4;
            };
        }
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        ia = (ia + za.segs[Tb].base) >> 0;
        return ia;
    }

    function Wb(Ja, ja) {
        if (Ja & 4) Aa[Ja & 3] = (Aa[Ja & 3] & -65281) | ((ja & 0xff) << 8);
        else Aa[Ja & 3] = (Aa[Ja & 3] & -256) | (ja & 0xff);
    }

    function Xb(Ja, ja) {
        Aa[Ja] = (Aa[Ja] & -65536) | (ja & 0xffff);
    }

    function Yb(Ma, Zb, ac) {
        var bc;
        switch (Ma) {
        case 0:
            Ba = ac;
            Zb = (Zb + ac) >> 0;
            Ca = Zb;
            Da = 2;
            break;
        case 1:
            Zb = Zb | ac;
            Ca = Zb;
            Da = 14;
            break;
        case 2:
            bc = cc();
            Ba = ac;
            Zb = (Zb + ac + bc) >> 0;
            Ca = Zb;
            Da = bc ? 5 : 2;
            break;
        case 3:
            bc = cc();
            Ba = ac;
            Zb = (Zb - ac - bc) >> 0;
            Ca = Zb;
            Da = bc ? 11 : 8;
            break;
        case 4:
            Zb = Zb & ac;
            Ca = Zb;
            Da = 14;
            break;
        case 5:
            Ba = ac;
            Zb = (Zb - ac) >> 0;
            Ca = Zb;
            Da = 8;
            break;
        case 6:
            Zb = Zb ^ ac;
            Ca = Zb;
            Da = 14;
            break;
        case 7:
            Ba = ac;
            Ca = (Zb - ac) >> 0;
            Da = 8;
            break;
        default:
            throw "arith32: invalid op";
        }
        return Zb;
    }

    function dc(Ma, Zb, ac) {
        var bc;
        switch (Ma) {
        case 0:
            Ba = ac;
            Zb = (((Zb + ac) << 16) >> 16);
            Ca = Zb;
            Da = 1;
            break;
        case 1:
            Zb = (((Zb | ac) << 16) >> 16);
            Ca = Zb;
            Da = 13;
            break;
        case 2:
            bc = cc();
            Ba = ac;
            Zb = (((Zb + ac + bc) << 16) >> 16);
            Ca = Zb;
            Da = bc ? 4 : 1;
            break;
        case 3:
            bc = cc();
            Ba = ac;
            Zb = (((Zb - ac - bc) << 16) >> 16);
            Ca = Zb;
            Da = bc ? 10 : 7;
            break;
        case 4:
            Zb = (((Zb & ac) << 16) >> 16);
            Ca = Zb;
            Da = 13;
            break;
        case 5:
            Ba = ac;
            Zb = (((Zb - ac) << 16) >> 16);
            Ca = Zb;
            Da = 7;
            break;
        case 6:
            Zb = (((Zb ^ ac) << 16) >> 16);
            Ca = Zb;
            Da = 13;
            break;
        case 7:
            Ba = ac;
            Ca = (((Zb - ac) << 16) >> 16);
            Da = 7;
            break;
        default:
            throw "arith16: invalid op";
        }
        return Zb;
    }

    function ec(ja) {
        if (Da < 25) {
            Ea = Da;
            Fa = Ca;
        }
        Ca = (((ja + 1) << 16) >> 16);
        Da = 26;
        return Ca;
    }

    function fc(ja) {
        if (Da < 25) {
            Ea = Da;
            Fa = Ca;
        }
        Ca = (((ja - 1) << 16) >> 16);
        Da = 29;
        return Ca;
    }

    function gc(Ma, Zb, ac) {
        var bc;
        switch (Ma) {
        case 0:
            Ba = ac;
            Zb = (((Zb + ac) << 24) >> 24);
            Ca = Zb;
            Da = 0;
            break;
        case 1:
            Zb = (((Zb | ac) << 24) >> 24);
            Ca = Zb;
            Da = 12;
            break;
        case 2:
            bc = cc();
            Ba = ac;
            Zb = (((Zb + ac + bc) << 24) >> 24);
            Ca = Zb;
            Da = bc ? 3 : 0;
            break;
        case 3:
            bc = cc();
            Ba = ac;
            Zb = (((Zb - ac - bc) << 24) >> 24);
            Ca = Zb;
            Da = bc ? 9 : 6;
            break;
        case 4:
            Zb = (((Zb & ac) << 24) >> 24);
            Ca = Zb;
            Da = 12;
            break;
        case 5:
            Ba = ac;
            Zb = (((Zb - ac) << 24) >> 24);
            Ca = Zb;
            Da = 6;
            break;
        case 6:
            Zb = (((Zb ^ ac) << 24) >> 24);
            Ca = Zb;
            Da = 12;
            break;
        case 7:
            Ba = ac;
            Ca = (((Zb - ac) << 24) >> 24);
            Da = 6;
            break;
        default:
            throw "arith8: invalid op";
        }
        return Zb;
    }

    function hc(ja) {
        if (Da < 25) {
            Ea = Da;
            Fa = Ca;
        }
        Ca = (((ja + 1) << 24) >> 24);
        Da = 25;
        return Ca;
    }

    function ic(ja) {
        if (Da < 25) {
            Ea = Da;
            Fa = Ca;
        }
        Ca = (((ja - 1) << 24) >> 24);
        Da = 28;
        return Ca;
    }

    function jc(Ma, Zb, ac) {
        var kc, bc;
        switch (Ma) {
        case 0:
            if (ac & 0x1f) {
                ac &= 0x7;
                Zb &= 0xff;
                kc = Zb;
                Zb = (Zb << ac) | (Zb >>> (8 - ac));
                Ba = lc();
                Ba |= (Zb & 0x0001) | (((kc ^ Zb) << 4) & 0x0800);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 1:
            if (ac & 0x1f) {
                ac &= 0x7;
                Zb &= 0xff;
                kc = Zb;
                Zb = (Zb >>> ac) | (Zb << (8 - ac));
                Ba = lc();
                Ba |= ((Zb >> 7) & 0x0001) | (((kc ^ Zb) << 4) & 0x0800);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 2:
            ac = ca[ac & 0x1f];
            if (ac) {
                Zb &= 0xff;
                kc = Zb;
                bc = cc();
                Zb = (Zb << ac) | (bc << (ac - 1));
                if (ac > 1) Zb |= kc >>> (9 - ac);
                Ba = lc();
                Ba |= (((kc ^ Zb) << 4) & 0x0800) | ((kc >> (8 - ac)) & 0x0001);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 3:
            ac = ca[ac & 0x1f];
            if (ac) {
                Zb &= 0xff;
                kc = Zb;
                bc = cc();
                Zb = (Zb >>> ac) | (bc << (8 - ac));
                if (ac > 1) Zb |= kc << (9 - ac);
                Ba = lc();
                Ba |= (((kc ^ Zb) << 4) & 0x0800) | ((kc >> (ac - 1)) & 0x0001);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 4:
        case 6:
            ac &= 0x1f;
            if (ac) {
                Ba = Zb << (ac - 1);
                Ca = Zb = (((Zb << ac) << 24) >> 24);
                Da = 15;
            }
            break;
        case 5:
            ac &= 0x1f;
            if (ac) {
                Zb &= 0xff;
                Ba = Zb >>> (ac - 1);
                Ca = Zb = (((Zb >>> ac) << 24) >> 24);
                Da = 18;
            }
            break;
        case 7:
            ac &= 0x1f;
            if (ac) {
                Zb = (Zb << 24) >> 24;
                Ba = Zb >> (ac - 1);
                Ca = Zb = (((Zb >> ac) << 24) >> 24);
                Da = 18;
            }
            break;
        default:
            throw "unsupported shift8=" + Ma;
        }
        return Zb;
    }

    function mc(Ma, Zb, ac) {
        var kc, bc;
        switch (Ma) {
        case 0:
            if (ac & 0x1f) {
                ac &= 0xf;
                Zb &= 0xffff;
                kc = Zb;
                Zb = (Zb << ac) | (Zb >>> (16 - ac));
                Ba = lc();
                Ba |= (Zb & 0x0001) | (((kc ^ Zb) >> 4) & 0x0800);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 1:
            if (ac & 0x1f) {
                ac &= 0xf;
                Zb &= 0xffff;
                kc = Zb;
                Zb = (Zb >>> ac) | (Zb << (16 - ac));
                Ba = lc();
                Ba |= ((Zb >> 15) & 0x0001) | (((kc ^ Zb) >> 4) & 0x0800);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 2:
            ac = ba[ac & 0x1f];
            if (ac) {
                Zb &= 0xffff;
                kc = Zb;
                bc = cc();
                Zb = (Zb << ac) | (bc << (ac - 1));
                if (ac > 1) Zb |= kc >>> (17 - ac);
                Ba = lc();
                Ba |= (((kc ^ Zb) >> 4) & 0x0800) | ((kc >> (16 - ac)) & 0x0001);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 3:
            ac = ba[ac & 0x1f];
            if (ac) {
                Zb &= 0xffff;
                kc = Zb;
                bc = cc();
                Zb = (Zb >>> ac) | (bc << (16 - ac));
                if (ac > 1) Zb |= kc << (17 - ac);
                Ba = lc();
                Ba |= (((kc ^ Zb) >> 4) & 0x0800) | ((kc >> (ac - 1)) & 0x0001);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 4:
        case 6:
            ac &= 0x1f;
            if (ac) {
                Ba = Zb << (ac - 1);
                Ca = Zb = (((Zb << ac) << 16) >> 16);
                Da = 16;
            }
            break;
        case 5:
            ac &= 0x1f;
            if (ac) {
                Zb &= 0xffff;
                Ba = Zb >>> (ac - 1);
                Ca = Zb = (((Zb >>> ac) << 16) >> 16);
                Da = 19;
            }
            break;
        case 7:
            ac &= 0x1f;
            if (ac) {
                Zb = (Zb << 16) >> 16;
                Ba = Zb >> (ac - 1);
                Ca = Zb = (((Zb >> ac) << 16) >> 16);
                Da = 19;
            }
            break;
        default:
            throw "unsupported shift16=" + Ma;
        }
        return Zb;
    }

    function nc(Ma, Zb, ac) {
        var kc, bc;
        switch (Ma) {
        case 0:
            ac &= 0x1f;
            if (ac) {
                kc = Zb;
                Zb = (Zb << ac) | (Zb >>> (32 - ac));
                Ba = lc();
                Ba |= (Zb & 0x0001) | (((kc ^ Zb) >> 20) & 0x0800);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 1:
            ac &= 0x1f;
            if (ac) {
                kc = Zb;
                Zb = (Zb >>> ac) | (Zb << (32 - ac));
                Ba = lc();
                Ba |= ((Zb >> 31) & 0x0001) | (((kc ^ Zb) >> 20) & 0x0800);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 2:
            ac &= 0x1f;
            if (ac) {
                kc = Zb;
                bc = cc();
                Zb = (Zb << ac) | (bc << (ac - 1));
                if (ac > 1) Zb |= kc >>> (33 - ac);
                Ba = lc();
                Ba |= (((kc ^ Zb) >> 20) & 0x0800) | ((kc >> (32 - ac)) & 0x0001);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 3:
            ac &= 0x1f;
            if (ac) {
                kc = Zb;
                bc = cc();
                Zb = (Zb >>> ac) | (bc << (32 - ac));
                if (ac > 1) Zb |= kc << (33 - ac);
                Ba = lc();
                Ba |= (((kc ^ Zb) >> 20) & 0x0800) | ((kc >> (ac - 1)) & 0x0001);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
            }
            break;
        case 4:
        case 6:
            ac &= 0x1f;
            if (ac) {
                Ba = Zb << (ac - 1);
                Ca = Zb = Zb << ac;
                Da = 17;
            }
            break;
        case 5:
            ac &= 0x1f;
            if (ac) {
                Ba = Zb >>> (ac - 1);
                Ca = Zb = Zb >>> ac;
                Da = 20;
            }
            break;
        case 7:
            ac &= 0x1f;
            if (ac) {
                Ba = Zb >> (ac - 1);
                Ca = Zb = Zb >> ac;
                Da = 20;
            }
            break;
        default:
            throw "unsupported shift32=" + Ma;
        }
        return Zb;
    }

    function oc(Ma, Zb, ac, pc) {
        var qc;
        pc &= 0x1f;
        if (pc) {
            if (Ma == 0) {
                ac &= 0xffff;
                qc = ac | (Zb << 16);
                Ba = qc >> (32 - pc);
                qc <<= pc;
                if (pc > 16) qc |= ac << (pc - 16);
                Zb = Ca = qc >> 16;
                Da = 19;
            } else {
                qc = (Zb & 0xffff) | (ac << 16);
                Ba = qc >> (pc - 1);
                qc >>= pc;
                if (pc > 16) qc |= ac << (32 - pc);
                Zb = Ca = (((qc) << 16) >> 16);
                Da = 19;
            }
        }
        return Zb;
    }

    function rc(Zb, ac, pc) {
        pc &= 0x1f;
        if (pc) {
            Ba = Zb << (pc - 1);
            Ca = Zb = (Zb << pc) | (ac >>> (32 - pc));
            Da = 17;
        }
        return Zb;
    }

    function sc(Zb, ac, pc) {
        pc &= 0x1f;
        if (pc) {
            Ba = Zb >> (pc - 1);
            Ca = Zb = (Zb >>> pc) | (ac << (32 - pc));
            Da = 20;
        }
        return Zb;
    }

    function tc(Zb, ac) {
        ac &= 0xf;
        Ba = Zb >> ac;
        Da = 19;
    }

    function uc(Zb, ac) {
        ac &= 0x1f;
        Ba = Zb >> ac;
        Da = 20;
    }

    function vc(Ma, Zb, ac) {
        var wc;
        ac &= 0xf;
        Ba = Zb >> ac;
        wc = 1 << ac;
        switch (Ma) {
        case 1:
            Zb |= wc;
            break;
        case 2:
            Zb &= ~wc;
            break;
        case 3:
        default:
            Zb ^= wc;
            break;
        }
        Da = 19;
        return Zb;
    }

    function xc(Ma, Zb, ac) {
        var wc;
        ac &= 0x1f;
        Ba = Zb >> ac;
        wc = 1 << ac;
        switch (Ma) {
        case 1:
            Zb |= wc;
            break;
        case 2:
            Zb &= ~wc;
            break;
        case 3:
        default:
            Zb ^= wc;
            break;
        }
        Da = 20;
        return Zb;
    }

    function yc(Zb, ac) {
        ac &= 0xffff;
        if (ac) {
            Zb = 0;
            while ((ac & 1) == 0) {
                Zb++;
                ac >>= 1;
            }
            Ca = 1;
        } else {
            Ca = 0;
        }
        Da = 14;
        return Zb;
    }

    function zc(Zb, ac) {
        if (ac) {
            Zb = 0;
            while ((ac & 1) == 0) {
                Zb++;
                ac >>= 1;
            }
            Ca = 1;
        } else {
            Ca = 0;
        }
        Da = 14;
        return Zb;
    }

    function Ac(Zb, ac) {
        ac &= 0xffff;
        if (ac) {
            Zb = 15;
            while ((ac & 0x8000) == 0) {
                Zb--;
                ac <<= 1;
            }
            Ca = 1;
        } else {
            Ca = 0;
        }
        Da = 14;
        return Zb;
    }

    function Bc(Zb, ac) {
        if (ac) {
            Zb = 31;
            while (ac >= 0) {
                Zb--;
                ac <<= 1;
            }
            Ca = 1;
        } else {
            Ca = 0;
        }
        Da = 14;
        return Zb;
    }

    function Cc(b) {
        var a, q, r;
        a = Aa[0] & 0xffff;
        b &= 0xff;
        if ((a >> 8) >= b) Dc(0);
        q = (a / b) >> 0;
        r = (a % b);
        Xb(0, (q & 0xff) | (r << 8));
    }

    function Ec(b) {
        var a, q, r;
        a = (Aa[0] << 16) >> 16;
        b = (b << 24) >> 24;
        if (b == 0) Dc(0);
        q = (a / b) >> 0;
        if (((q << 24) >> 24) != q) Dc(0);
        r = (a % b);
        Xb(0, (q & 0xff) | (r << 8));
    }

    function Fc(b) {
        var a, q, r;
        a = (Aa[2] << 16) | (Aa[0] & 0xffff);
        b &= 0xffff;
        if ((a >>> 16) >= b) Dc(0);
        q = (a / b) >> 0;
        r = (a % b);
        Xb(0, q);
        Xb(2, r);
    }

    function Gc(b) {
        var a, q, r;
        a = (Aa[2] << 16) | (Aa[0] & 0xffff);
        b = (b << 16) >> 16;
        if (b == 0) Dc(0);
        q = (a / b) >> 0;
        if (((q << 16) >> 16) != q) Dc(0);
        r = (a % b);
        Xb(0, q);
        Xb(2, r);
    }

    function Hc(Ic, Jc, b) {
        var a, i, Kc;
        Ic = Ic >>> 0;
        Jc = Jc >>> 0;
        b = b >>> 0;
        if (Ic >= b) {
            Dc(0);
        }
        if (Ic >= 0 && Ic <= 0x200000) {
            a = Ic * 4294967296 + Jc;
            Pa = (a % b) >> 0;
            return (a / b) >> 0;
        } else {
            for (i = 0; i < 32; i++) {
                Kc = Ic >> 31;
                Ic = ((Ic << 1) | (Jc >>> 31)) >>> 0;
                if (Kc || Ic >= b) {
                    Ic = Ic - b;
                    Jc = (Jc << 1) | 1;
                } else {
                    Jc = Jc << 1;
                }
            }
            Pa = Ic >> 0;
            return Jc;
        }
    }

    function Lc(Ic, Jc, b) {
        var Mc, Nc, q;
        if (Ic < 0) {
            Mc = 1;
            Ic = ~Ic;
            Jc = (-Jc) >> 0;
            if (Jc == 0) Ic = (Ic + 1) >> 0;
        } else {
            Mc = 0;
        } if (b < 0) {
            b = (-b) >> 0;
            Nc = 1;
        } else {
            Nc = 0;
        }
        q = Hc(Ic, Jc, b);
        Nc ^= Mc;
        if (Nc) {
            if ((q >>> 0) > 0x80000000) Dc(0);
            q = (-q) >> 0;
        } else {
            if ((q >>> 0) >= 0x80000000) Dc(0);
        } if (Mc) {
            Pa = (-Pa) >> 0;
        }
        return q;
    }

    function Oc(a, b) {
        var qc;
        a &= 0xff;
        b &= 0xff;
        qc = (a * b) >> 0;
        Ba = qc >> 8;
        Ca = (((qc) << 24) >> 24);
        Da = 21;
        return qc;
    }

    function Pc(a, b) {
        var qc;
        a = (((a) << 24) >> 24);
        b = (((b) << 24) >> 24);
        qc = (a * b) >> 0;
        Ca = (((qc) << 24) >> 24);
        Ba = (qc != Ca) >> 0;
        Da = 21;
        return qc;
    }

    function Qc(a, b) {
        var qc;
        a &= 0xffff;
        b &= 0xffff;
        qc = (a * b) >> 0;
        Ba = qc >>> 16;
        Ca = (((qc) << 16) >> 16);
        Da = 22;
        return qc;
    }

    function Rc(a, b) {
        var qc;
        a = (a << 16) >> 16;
        b = (b << 16) >> 16;
        qc = (a * b) >> 0;
        Ca = (((qc) << 16) >> 16);
        Ba = (qc != Ca) >> 0;
        Da = 22;
        return qc;
    }

    function Sc(a, b) {
        var r, Jc, Ic, Tc, Uc, m;
        a = a >>> 0;
        b = b >>> 0;
        r = a * b;
        if (r <= 0xffffffff) {
            Pa = 0;
            r &= -1;
        } else {
            Jc = a & 0xffff;
            Ic = a >>> 16;
            Tc = b & 0xffff;
            Uc = b >>> 16;
            r = Jc * Tc;
            Pa = Ic * Uc;
            m = Jc * Uc;
            r += (((m & 0xffff) << 16) >>> 0);
            Pa += (m >>> 16);
            if (r >= 4294967296) {
                r -= 4294967296;
                Pa++;
            }
            m = Ic * Tc;
            r += (((m & 0xffff) << 16) >>> 0);
            Pa += (m >>> 16);
            if (r >= 4294967296) {
                r -= 4294967296;
                Pa++;
            }
            r &= -1;
            Pa &= -1;
        }
        return r;
    }

    function Vc(a, b) {
        Ca = Sc(a, b);
        Ba = Pa;
        Da = 23;
        return Ca;
    }

    function Wc(a, b) {
        var s, r;
        s = 0;
        if (a < 0) {
            a = -a;
            s = 1;
        }
        if (b < 0) {
            b = -b;
            s ^= 1;
        }
        r = Sc(a, b);
        if (s) {
            Pa = ~Pa;
            r = (-r) >> 0;
            if (r == 0) {
                Pa = (Pa + 1) >> 0;
            }
        }
        Ca = r;
        Ba = (Pa - (r >> 31)) >> 0;
        Da = 23;
        return r;
    }

    function cc() {
        var Zb, qc, Xc, Yc;
        if (Da >= 25) {
            Xc = Ea;
            Yc = Fa;
        } else {
            Xc = Da;
            Yc = Ca;
        }
        switch (Xc) {
        case 0:
            qc = (Yc & 0xff) < (Ba & 0xff);
            break;
        case 1:
            qc = (Yc & 0xffff) < (Ba & 0xffff);
            break;
        case 2:
            qc = (Yc >>> 0) < (Ba >>> 0);
            break;
        case 3:
            qc = (Yc & 0xff) <= (Ba & 0xff);
            break;
        case 4:
            qc = (Yc & 0xffff) <= (Ba & 0xffff);
            break;
        case 5:
            qc = (Yc >>> 0) <= (Ba >>> 0);
            break;
        case 6:
            qc = ((Yc + Ba) & 0xff) < (Ba & 0xff);
            break;
        case 7:
            qc = ((Yc + Ba) & 0xffff) < (Ba & 0xffff);
            break;
        case 8:
            qc = ((Yc + Ba) >>> 0) < (Ba >>> 0);
            break;
        case 9:
            Zb = (Yc + Ba + 1) & 0xff;
            qc = Zb <= (Ba & 0xff);
            break;
        case 10:
            Zb = (Yc + Ba + 1) & 0xffff;
            qc = Zb <= (Ba & 0xffff);
            break;
        case 11:
            Zb = (Yc + Ba + 1) >>> 0;
            qc = Zb <= (Ba >>> 0);
            break;
        case 12:
        case 13:
        case 14:
            qc = 0;
            break;
        case 15:
            qc = (Ba >> 7) & 1;
            break;
        case 16:
            qc = (Ba >> 15) & 1;
            break;
        case 17:
            qc = (Ba >> 31) & 1;
            break;
        case 18:
        case 19:
        case 20:
            qc = Ba & 1;
            break;
        case 21:
        case 22:
        case 23:
            qc = Ba != 0;
            break;
        case 24:
            qc = Ba & 1;
            break;
        default:
            throw "GET_CARRY: unsupported cc_op=" + Da;
        }
        return qc;
    }

    function Zc() {
        var qc, Zb;
        switch (Da) {
        case 0:
            Zb = (Ca - Ba) >> 0;
            qc = (((Zb ^ Ba ^ -1) & (Zb ^ Ca)) >> 7) & 1;
            break;
        case 1:
            Zb = (Ca - Ba) >> 0;
            qc = (((Zb ^ Ba ^ -1) & (Zb ^ Ca)) >> 15) & 1;
            break;
        case 2:
            Zb = (Ca - Ba) >> 0;
            qc = (((Zb ^ Ba ^ -1) & (Zb ^ Ca)) >> 31) & 1;
            break;
        case 3:
            Zb = (Ca - Ba - 1) >> 0;
            qc = (((Zb ^ Ba ^ -1) & (Zb ^ Ca)) >> 7) & 1;
            break;
        case 4:
            Zb = (Ca - Ba - 1) >> 0;
            qc = (((Zb ^ Ba ^ -1) & (Zb ^ Ca)) >> 15) & 1;
            break;
        case 5:
            Zb = (Ca - Ba - 1) >> 0;
            qc = (((Zb ^ Ba ^ -1) & (Zb ^ Ca)) >> 31) & 1;
            break;
        case 6:
            Zb = (Ca + Ba) >> 0;
            qc = (((Zb ^ Ba) & (Zb ^ Ca)) >> 7) & 1;
            break;
        case 7:
            Zb = (Ca + Ba) >> 0;
            qc = (((Zb ^ Ba) & (Zb ^ Ca)) >> 15) & 1;
            break;
        case 8:
            Zb = (Ca + Ba) >> 0;
            qc = (((Zb ^ Ba) & (Zb ^ Ca)) >> 31) & 1;
            break;
        case 9:
            Zb = (Ca + Ba + 1) >> 0;
            qc = (((Zb ^ Ba) & (Zb ^ Ca)) >> 7) & 1;
            break;
        case 10:
            Zb = (Ca + Ba + 1) >> 0;
            qc = (((Zb ^ Ba) & (Zb ^ Ca)) >> 15) & 1;
            break;
        case 11:
            Zb = (Ca + Ba + 1) >> 0;
            qc = (((Zb ^ Ba) & (Zb ^ Ca)) >> 31) & 1;
            break;
        case 12:
        case 13:
        case 14:
            qc = 0;
            break;
        case 15:
        case 18:
            qc = ((Ba ^ Ca) >> 7) & 1;
            break;
        case 16:
        case 19:
            qc = ((Ba ^ Ca) >> 15) & 1;
            break;
        case 17:
        case 20:
            qc = ((Ba ^ Ca) >> 31) & 1;
            break;
        case 21:
        case 22:
        case 23:
            qc = Ba != 0;
            break;
        case 24:
            qc = (Ba >> 11) & 1;
            break;
        case 25:
            qc = (Ca & 0xff) == 0x80;
            break;
        case 26:
            qc = (Ca & 0xffff) == 0x8000;
            break;
        case 27:
            qc = (Ca == -2147483648);
            break;
        case 28:
            qc = (Ca & 0xff) == 0x7f;
            break;
        case 29:
            qc = (Ca & 0xffff) == 0x7fff;
            break;
        case 30:
            qc = Ca == 0x7fffffff;
            break;
        default:
            throw "JO: unsupported cc_op=" + Da;
        }
        return qc;
    }

    function ad() {
        var qc;
        switch (Da) {
        case 6:
            qc = ((Ca + Ba) & 0xff) <= (Ba & 0xff);
            break;
        case 7:
            qc = ((Ca + Ba) & 0xffff) <= (Ba & 0xffff);
            break;
        case 8:
            qc = ((Ca + Ba) >>> 0) <= (Ba >>> 0);
            break;
        case 24:
            qc = (Ba & (0x0040 | 0x0001)) != 0;
            break;
        default:
            qc = cc() | (Ca == 0);
            break;
        }
        return qc;
    }

    function bd() {
        if (Da == 24) {
            return (Ba >> 2) & 1;
        } else {
            return aa[Ca & 0xff];
        }
    }

    function cd() {
        var qc;
        switch (Da) {
        case 6:
            qc = ((Ca + Ba) << 24) < (Ba << 24);
            break;
        case 7:
            qc = ((Ca + Ba) << 16) < (Ba << 16);
            break;
        case 8:
            qc = ((Ca + Ba) >> 0) < Ba;
            break;
        case 12:
        case 25:
        case 28:
        case 13:
        case 26:
        case 29:
        case 14:
        case 27:
        case 30:
            qc = Ca < 0;
            break;
        case 24:
            qc = ((Ba >> 7) ^ (Ba >> 11)) & 1;
            break;
        default:
            qc = (Da == 24 ? ((Ba >> 7) & 1) : (Ca < 0)) ^ Zc();
            break;
        }
        return qc;
    }

    function dd() {
        var qc;
        switch (Da) {
        case 6:
            qc = ((Ca + Ba) << 24) <= (Ba << 24);
            break;
        case 7:
            qc = ((Ca + Ba) << 16) <= (Ba << 16);
            break;
        case 8:
            qc = ((Ca + Ba) >> 0) <= Ba;
            break;
        case 12:
        case 25:
        case 28:
        case 13:
        case 26:
        case 29:
        case 14:
        case 27:
        case 30:
            qc = Ca <= 0;
            break;
        case 24:
            qc = (((Ba >> 7) ^ (Ba >> 11)) | (Ba >> 6)) & 1;
            break;
        default:
            qc = ((Da == 24 ? ((Ba >> 7) & 1) : (Ca < 0)) ^ Zc()) | (Ca == 0);
            break;
        }
        return qc;
    }

    function ed() {
        var Zb, qc;
        switch (Da) {
        case 0:
        case 1:
        case 2:
            Zb = (Ca - Ba) >> 0;
            qc = (Ca ^ Zb ^ Ba) & 0x10;
            break;
        case 3:
        case 4:
        case 5:
            Zb = (Ca - Ba - 1) >> 0;
            qc = (Ca ^ Zb ^ Ba) & 0x10;
            break;
        case 6:
        case 7:
        case 8:
            Zb = (Ca + Ba) >> 0;
            qc = (Ca ^ Zb ^ Ba) & 0x10;
            break;
        case 9:
        case 10:
        case 11:
            Zb = (Ca + Ba + 1) >> 0;
            qc = (Ca ^ Zb ^ Ba) & 0x10;
            break;
        case 12:
        case 13:
        case 14:
            qc = 0;
            break;
        case 15:
        case 18:
        case 16:
        case 19:
        case 17:
        case 20:
        case 21:
        case 22:
        case 23:
            qc = 0;
            break;
        case 24:
            qc = Ba & 0x10;
            break;
        case 25:
        case 26:
        case 27:
            qc = (Ca ^ (Ca - 1)) & 0x10;
            break;
        case 28:
        case 29:
        case 30:
            qc = (Ca ^ (Ca + 1)) & 0x10;
            break;
        default:
            throw "AF: unsupported cc_op=" + Da;
        }
        return qc;
    }

    function fd(gd) {
        var qc;
        switch (gd >> 1) {
        case 0:
            qc = Zc();
            break;
        case 1:
            qc = cc();
            break;
        case 2:
            qc = (Ca == 0);
            break;
        case 3:
            qc = ad();
            break;
        case 4:
            qc = (Da == 24 ? ((Ba >> 7) & 1) : (Ca < 0));
            break;
        case 5:
            qc = bd();
            break;
        case 6:
            qc = cd();
            break;
        case 7:
            qc = dd();
            break;
        default:
            throw "unsupported cond: " + gd;
        }
        return qc ^ (gd & 1);
    }

    function lc() {
        return (bd() << 2) | ((Ca == 0) << 6) | ((Da == 24 ? ((Ba >> 7) & 1) : (Ca < 0)) << 7) | ed();
    }

    function hd() {
        return (cc() << 0) | (bd() << 2) | ((Ca == 0) << 6) | ((Da == 24 ? ((Ba >> 7) & 1) : (Ca < 0)) << 7) | (Zc() << 11) | ed();
    }

    function id() {
        var jd;
        jd = hd();
        jd |= za.df & 0x00000400;
        jd |= za.eflags;
        return jd;
    }

    function kd(jd, ld) {
        Ba = jd & (0x0800 | 0x0080 | 0x0040 | 0x0010 | 0x0004 | 0x0001);
        Ca = ((Ba >> 6) & 1) ^ 1;
        Da = 24;
        za.df = 1 - (2 * ((jd >> 10) & 1));
        za.eflags = (za.eflags & ~ld) | (jd & ld);
    }

    function md() {
        return za.cycle_count + (xa - Na);
    }

    function nd(qa) {
        throw "CPU abort: " + qa;
    }

    function od() {
        za.eip = Kb;
        za.cc_src = Ba;
        za.cc_dst = Ca;
        za.cc_op = Da;
        za.cc_op2 = Ea;
        za.cc_dst2 = Fa;
        za.dump();
    }

    function pd() {
        za.eip = Kb;
        za.cc_src = Ba;
        za.cc_dst = Ca;
        za.cc_op = Da;
        za.cc_op2 = Ea;
        za.cc_dst2 = Fa;
        za.dump_short();
    }

    function qd(intno, error_code) {
        za.cycle_count += (xa - Na);
        za.eip = Kb;
        za.cc_src = Ba;
        za.cc_dst = Ca;
        za.cc_op = Da;
        za.cc_op2 = Ea;
        za.cc_dst2 = Fa;
        throw {
            intno: intno,
            error_code: error_code
        };
    }

    function Dc(intno) {
        qd(intno, 0);
    }

    function rd(sd) {
        za.cpl = sd;
        if (za.cpl == 3) {
            cb = ab;
            db = bb;
        } else {
            cb = Ya;
            db = Za;
        }
    }

    function td(ia, ud) {
        var fb;
        if (ud) {
            fb = db[ia >>> 12];
        } else {
            fb = cb[ia >>> 12];
        } if (fb == -1) {
            gb(ia, ud, za.cpl == 3);
            if (ud) {
                fb = db[ia >>> 12];
            } else {
                fb = cb[ia >>> 12];
            }
        }
        return fb ^ ia;
    }

    function vd(ja) {
        var wd;
        wd = Aa[4] - 2;
        ia = ((wd & Sa) + Ra) >> 0;
        vb(ja);
        Aa[4] = (Aa[4] & ~Sa) | ((wd) & Sa);
    }

    function xd(ja) {
        var wd;
        wd = Aa[4] - 4;
        ia = ((wd & Sa) + Ra) >> 0;
        xb(ja);
        Aa[4] = (Aa[4] & ~Sa) | ((wd) & Sa);
    }

    function yd() {
        ia = ((Aa[4] & Sa) + Ra) >> 0;
        return jb();
    }

    function zd() {
        Aa[4] = (Aa[4] & ~Sa) | ((Aa[4] + 2) & Sa);
    }

    function Ad() {
        ia = ((Aa[4] & Sa) + Ra) >> 0;
        return lb();
    }

    function Bd() {
        Aa[4] = (Aa[4] & ~Sa) | ((Aa[4] + 4) & Sa);
    }

    function Cd(Ob, b) {
        var n, Ga, l, Ha, Dd, base, Ma, Ed;
        n = 1;
        Ga = Ua;
        if (Ga & 0x0100) Ed = 2;
        else Ed = 4;
        Fd: for (;;) {
            switch (b) {
            case 0x66:
                if (Ua & 0x0100) {
                    Ed = 4;
                    Ga &= ~0x0100;
                } else {
                    Ed = 2;
                    Ga |= 0x0100;
                }
            case 0xf0:
            case 0xf2:
            case 0xf3:
            case 0x26:
            case 0x2e:
            case 0x36:
            case 0x3e:
            case 0x64:
            case 0x65:
                {
                    if ((n + 1) > 15) Dc(6);
                    ia = (Ob + (n++)) >> 0;
                    b = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                };
                break;
            case 0x67:
                if (Ua & 0x0080) {
                    Ga &= ~0x0080;
                } else {
                    Ga |= 0x0080;
                } {
                    if ((n + 1) > 15) Dc(6);
                    ia = (Ob + (n++)) >> 0;
                    b = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                };
                break;
            case 0x91:
            case 0x92:
            case 0x93:
            case 0x94:
            case 0x95:
            case 0x96:
            case 0x97:
            case 0x40:
            case 0x41:
            case 0x42:
            case 0x43:
            case 0x44:
            case 0x45:
            case 0x46:
            case 0x47:
            case 0x48:
            case 0x49:
            case 0x4a:
            case 0x4b:
            case 0x4c:
            case 0x4d:
            case 0x4e:
            case 0x4f:
            case 0x50:
            case 0x51:
            case 0x52:
            case 0x53:
            case 0x54:
            case 0x55:
            case 0x56:
            case 0x57:
            case 0x58:
            case 0x59:
            case 0x5a:
            case 0x5b:
            case 0x5c:
            case 0x5d:
            case 0x5e:
            case 0x5f:
            case 0x98:
            case 0x99:
            case 0xc9:
            case 0x9c:
            case 0x9d:
            case 0x06:
            case 0x0e:
            case 0x16:
            case 0x1e:
            case 0x07:
            case 0x17:
            case 0x1f:
            case 0xc3:
            case 0xcb:
            case 0x90:
            case 0xcc:
            case 0xce:
            case 0xcf:
            case 0xf5:
            case 0xf8:
            case 0xf9:
            case 0xfc:
            case 0xfd:
            case 0xfa:
            case 0xfb:
            case 0x9e:
            case 0x9f:
            case 0xf4:
            case 0xa4:
            case 0xa5:
            case 0xaa:
            case 0xab:
            case 0xa6:
            case 0xa7:
            case 0xac:
            case 0xad:
            case 0xae:
            case 0xaf:
            case 0x9b:
            case 0xec:
            case 0xed:
            case 0xee:
            case 0xef:
            case 0xd7:
            case 0x27:
            case 0x2f:
            case 0x37:
            case 0x3f:
            case 0x60:
            case 0x61:
            case 0x6c:
            case 0x6d:
            case 0x6e:
            case 0x6f:
                break Fd;
            case 0xb0:
            case 0xb1:
            case 0xb2:
            case 0xb3:
            case 0xb4:
            case 0xb5:
            case 0xb6:
            case 0xb7:
            case 0x04:
            case 0x0c:
            case 0x14:
            case 0x1c:
            case 0x24:
            case 0x2c:
            case 0x34:
            case 0x3c:
            case 0xa8:
            case 0x6a:
            case 0xeb:
            case 0x70:
            case 0x71:
            case 0x72:
            case 0x73:
            case 0x76:
            case 0x77:
            case 0x78:
            case 0x79:
            case 0x7a:
            case 0x7b:
            case 0x7c:
            case 0x7d:
            case 0x7e:
            case 0x7f:
            case 0x74:
            case 0x75:
            case 0xe0:
            case 0xe1:
            case 0xe2:
            case 0xe3:
            case 0xcd:
            case 0xe4:
            case 0xe5:
            case 0xe6:
            case 0xe7:
            case 0xd4:
            case 0xd5:
                n++;
                if (n > 15) Dc(6);
                break Fd;
            case 0xb8:
            case 0xb9:
            case 0xba:
            case 0xbb:
            case 0xbc:
            case 0xbd:
            case 0xbe:
            case 0xbf:
            case 0x05:
            case 0x0d:
            case 0x15:
            case 0x1d:
            case 0x25:
            case 0x2d:
            case 0x35:
            case 0x3d:
            case 0xa9:
            case 0x68:
            case 0xe9:
            case 0xe8:
                n += Ed;
                if (n > 15) Dc(6);
                break Fd;
            case 0x88:
            case 0x89:
            case 0x8a:
            case 0x8b:
            case 0x86:
            case 0x87:
            case 0x8e:
            case 0x8c:
            case 0xc4:
            case 0xc5:
            case 0x00:
            case 0x08:
            case 0x10:
            case 0x18:
            case 0x20:
            case 0x28:
            case 0x30:
            case 0x38:
            case 0x01:
            case 0x09:
            case 0x11:
            case 0x19:
            case 0x21:
            case 0x29:
            case 0x31:
            case 0x39:
            case 0x02:
            case 0x0a:
            case 0x12:
            case 0x1a:
            case 0x22:
            case 0x2a:
            case 0x32:
            case 0x3a:
            case 0x03:
            case 0x0b:
            case 0x13:
            case 0x1b:
            case 0x23:
            case 0x2b:
            case 0x33:
            case 0x3b:
            case 0x84:
            case 0x85:
            case 0xd0:
            case 0xd1:
            case 0xd2:
            case 0xd3:
            case 0x8f:
            case 0x8d:
            case 0xfe:
            case 0xff:
            case 0xd8:
            case 0xd9:
            case 0xda:
            case 0xdb:
            case 0xdc:
            case 0xdd:
            case 0xde:
            case 0xdf:
            case 0x62:
            case 0x63:
                {
                    {
                        if ((n + 1) > 15) Dc(6);
                        ia = (Ob + (n++)) >> 0;
                        Ha = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                    };
                    if (Ga & 0x0080) {
                        switch (Ha >> 6) {
                        case 0:
                            if ((Ha & 7) == 6) n += 2;
                            break;
                        case 1:
                            n++;
                            break;
                        case 2:
                            n += 2;
                            break;
                        case 3:
                        default:
                            break;
                        }
                    } else {
                        switch ((Ha & 7) | ((Ha >> 3) & 0x18)) {
                        case 0x04:
                            {
                                if ((n + 1) > 15) Dc(6);
                                ia = (Ob + (n++)) >> 0;
                                Dd = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                            };
                            if ((Dd & 7) == 5) {
                                n += 4;
                            }
                            break;
                        case 0x0c:
                            n += 2;
                            break;
                        case 0x14:
                            n += 5;
                            break;
                        case 0x05:
                            n += 4;
                            break;
                        case 0x00:
                        case 0x01:
                        case 0x02:
                        case 0x03:
                        case 0x06:
                        case 0x07:
                            break;
                        case 0x08:
                        case 0x09:
                        case 0x0a:
                        case 0x0b:
                        case 0x0d:
                        case 0x0e:
                        case 0x0f:
                            n++;
                            break;
                        case 0x10:
                        case 0x11:
                        case 0x12:
                        case 0x13:
                        case 0x15:
                        case 0x16:
                        case 0x17:
                            n += 4;
                            break;
                        }
                    } if (n > 15) Dc(6);
                };
                break Fd;
            case 0xa0:
            case 0xa1:
            case 0xa2:
            case 0xa3:
                if (Ga & 0x0100) n += 2;
                else n += 4; if (n > 15) Dc(6);
                break Fd;
            case 0xc6:
            case 0x80:
            case 0x82:
            case 0x83:
            case 0x6b:
            case 0xc0:
            case 0xc1:
                {
                    {
                        if ((n + 1) > 15) Dc(6);
                        ia = (Ob + (n++)) >> 0;
                        Ha = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                    };
                    if (Ga & 0x0080) {
                        switch (Ha >> 6) {
                        case 0:
                            if ((Ha & 7) == 6) n += 2;
                            break;
                        case 1:
                            n++;
                            break;
                        case 2:
                            n += 2;
                            break;
                        case 3:
                        default:
                            break;
                        }
                    } else {
                        switch ((Ha & 7) | ((Ha >> 3) & 0x18)) {
                        case 0x04:
                            {
                                if ((n + 1) > 15) Dc(6);
                                ia = (Ob + (n++)) >> 0;
                                Dd = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                            };
                            if ((Dd & 7) == 5) {
                                n += 4;
                            }
                            break;
                        case 0x0c:
                            n += 2;
                            break;
                        case 0x14:
                            n += 5;
                            break;
                        case 0x05:
                            n += 4;
                            break;
                        case 0x00:
                        case 0x01:
                        case 0x02:
                        case 0x03:
                        case 0x06:
                        case 0x07:
                            break;
                        case 0x08:
                        case 0x09:
                        case 0x0a:
                        case 0x0b:
                        case 0x0d:
                        case 0x0e:
                        case 0x0f:
                            n++;
                            break;
                        case 0x10:
                        case 0x11:
                        case 0x12:
                        case 0x13:
                        case 0x15:
                        case 0x16:
                        case 0x17:
                            n += 4;
                            break;
                        }
                    } if (n > 15) Dc(6);
                };
                n++;
                if (n > 15) Dc(6);
                break Fd;
            case 0xc7:
            case 0x81:
            case 0x69:
                {
                    {
                        if ((n + 1) > 15) Dc(6);
                        ia = (Ob + (n++)) >> 0;
                        Ha = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                    };
                    if (Ga & 0x0080) {
                        switch (Ha >> 6) {
                        case 0:
                            if ((Ha & 7) == 6) n += 2;
                            break;
                        case 1:
                            n++;
                            break;
                        case 2:
                            n += 2;
                            break;
                        case 3:
                        default:
                            break;
                        }
                    } else {
                        switch ((Ha & 7) | ((Ha >> 3) & 0x18)) {
                        case 0x04:
                            {
                                if ((n + 1) > 15) Dc(6);
                                ia = (Ob + (n++)) >> 0;
                                Dd = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                            };
                            if ((Dd & 7) == 5) {
                                n += 4;
                            }
                            break;
                        case 0x0c:
                            n += 2;
                            break;
                        case 0x14:
                            n += 5;
                            break;
                        case 0x05:
                            n += 4;
                            break;
                        case 0x00:
                        case 0x01:
                        case 0x02:
                        case 0x03:
                        case 0x06:
                        case 0x07:
                            break;
                        case 0x08:
                        case 0x09:
                        case 0x0a:
                        case 0x0b:
                        case 0x0d:
                        case 0x0e:
                        case 0x0f:
                            n++;
                            break;
                        case 0x10:
                        case 0x11:
                        case 0x12:
                        case 0x13:
                        case 0x15:
                        case 0x16:
                        case 0x17:
                            n += 4;
                            break;
                        }
                    } if (n > 15) Dc(6);
                };
                n += Ed;
                if (n > 15) Dc(6);
                break Fd;
            case 0xf6:
                {
                    {
                        if ((n + 1) > 15) Dc(6);
                        ia = (Ob + (n++)) >> 0;
                        Ha = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                    };
                    if (Ga & 0x0080) {
                        switch (Ha >> 6) {
                        case 0:
                            if ((Ha & 7) == 6) n += 2;
                            break;
                        case 1:
                            n++;
                            break;
                        case 2:
                            n += 2;
                            break;
                        case 3:
                        default:
                            break;
                        }
                    } else {
                        switch ((Ha & 7) | ((Ha >> 3) & 0x18)) {
                        case 0x04:
                            {
                                if ((n + 1) > 15) Dc(6);
                                ia = (Ob + (n++)) >> 0;
                                Dd = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                            };
                            if ((Dd & 7) == 5) {
                                n += 4;
                            }
                            break;
                        case 0x0c:
                            n += 2;
                            break;
                        case 0x14:
                            n += 5;
                            break;
                        case 0x05:
                            n += 4;
                            break;
                        case 0x00:
                        case 0x01:
                        case 0x02:
                        case 0x03:
                        case 0x06:
                        case 0x07:
                            break;
                        case 0x08:
                        case 0x09:
                        case 0x0a:
                        case 0x0b:
                        case 0x0d:
                        case 0x0e:
                        case 0x0f:
                            n++;
                            break;
                        case 0x10:
                        case 0x11:
                        case 0x12:
                        case 0x13:
                        case 0x15:
                        case 0x16:
                        case 0x17:
                            n += 4;
                            break;
                        }
                    } if (n > 15) Dc(6);
                };
                Ma = (Ha >> 3) & 7;
                if (Ma == 0) {
                    n++;
                    if (n > 15) Dc(6);
                }
                break Fd;
            case 0xf7:
                {
                    {
                        if ((n + 1) > 15) Dc(6);
                        ia = (Ob + (n++)) >> 0;
                        Ha = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                    };
                    if (Ga & 0x0080) {
                        switch (Ha >> 6) {
                        case 0:
                            if ((Ha & 7) == 6) n += 2;
                            break;
                        case 1:
                            n++;
                            break;
                        case 2:
                            n += 2;
                            break;
                        case 3:
                        default:
                            break;
                        }
                    } else {
                        switch ((Ha & 7) | ((Ha >> 3) & 0x18)) {
                        case 0x04:
                            {
                                if ((n + 1) > 15) Dc(6);
                                ia = (Ob + (n++)) >> 0;
                                Dd = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                            };
                            if ((Dd & 7) == 5) {
                                n += 4;
                            }
                            break;
                        case 0x0c:
                            n += 2;
                            break;
                        case 0x14:
                            n += 5;
                            break;
                        case 0x05:
                            n += 4;
                            break;
                        case 0x00:
                        case 0x01:
                        case 0x02:
                        case 0x03:
                        case 0x06:
                        case 0x07:
                            break;
                        case 0x08:
                        case 0x09:
                        case 0x0a:
                        case 0x0b:
                        case 0x0d:
                        case 0x0e:
                        case 0x0f:
                            n++;
                            break;
                        case 0x10:
                        case 0x11:
                        case 0x12:
                        case 0x13:
                        case 0x15:
                        case 0x16:
                        case 0x17:
                            n += 4;
                            break;
                        }
                    } if (n > 15) Dc(6);
                };
                Ma = (Ha >> 3) & 7;
                if (Ma == 0) {
                    n += Ed;
                    if (n > 15) Dc(6);
                }
                break Fd;
            case 0xea:
            case 0x9a:
                n += 2 + Ed;
                if (n > 15) Dc(6);
                break Fd;
            case 0xc2:
            case 0xca:
                n += 2;
                if (n > 15) Dc(6);
                break Fd;
            case 0xc8:
                n += 3;
                if (n > 15) Dc(6);
                break Fd;
            case 0xd6:
            case 0xf1:
            default:
                Dc(6);
            case 0x0f:
                {
                    if ((n + 1) > 15) Dc(6);
                    ia = (Ob + (n++)) >> 0;
                    b = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                };
                switch (b) {
                case 0x06:
                case 0xa2:
                case 0x31:
                case 0xa0:
                case 0xa8:
                case 0xa1:
                case 0xa9:
                case 0xc8:
                case 0xc9:
                case 0xca:
                case 0xcb:
                case 0xcc:
                case 0xcd:
                case 0xce:
                case 0xcf:
                    break Fd;
                case 0x80:
                case 0x81:
                case 0x82:
                case 0x83:
                case 0x84:
                case 0x85:
                case 0x86:
                case 0x87:
                case 0x88:
                case 0x89:
                case 0x8a:
                case 0x8b:
                case 0x8c:
                case 0x8d:
                case 0x8e:
                case 0x8f:
                    n += Ed;
                    if (n > 15) Dc(6);
                    break Fd;
                case 0x90:
                case 0x91:
                case 0x92:
                case 0x93:
                case 0x94:
                case 0x95:
                case 0x96:
                case 0x97:
                case 0x98:
                case 0x99:
                case 0x9a:
                case 0x9b:
                case 0x9c:
                case 0x9d:
                case 0x9e:
                case 0x9f:
                case 0x40:
                case 0x41:
                case 0x42:
                case 0x43:
                case 0x44:
                case 0x45:
                case 0x46:
                case 0x47:
                case 0x48:
                case 0x49:
                case 0x4a:
                case 0x4b:
                case 0x4c:
                case 0x4d:
                case 0x4e:
                case 0x4f:
                case 0xb6:
                case 0xb7:
                case 0xbe:
                case 0xbf:
                case 0x00:
                case 0x01:
                case 0x02:
                case 0x03:
                case 0x20:
                case 0x22:
                case 0x23:
                case 0xb2:
                case 0xb4:
                case 0xb5:
                case 0xa5:
                case 0xad:
                case 0xa3:
                case 0xab:
                case 0xb3:
                case 0xbb:
                case 0xbc:
                case 0xbd:
                case 0xaf:
                case 0xc0:
                case 0xc1:
                case 0xb0:
                case 0xb1:
                    {
                        {
                            if ((n + 1) > 15) Dc(6);
                            ia = (Ob + (n++)) >> 0;
                            Ha = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                        };
                        if (Ga & 0x0080) {
                            switch (Ha >> 6) {
                            case 0:
                                if ((Ha & 7) == 6) n += 2;
                                break;
                            case 1:
                                n++;
                                break;
                            case 2:
                                n += 2;
                                break;
                            case 3:
                            default:
                                break;
                            }
                        } else {
                            switch ((Ha & 7) | ((Ha >> 3) & 0x18)) {
                            case 0x04:
                                {
                                    if ((n + 1) > 15) Dc(6);
                                    ia = (Ob + (n++)) >> 0;
                                    Dd = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                                };
                                if ((Dd & 7) == 5) {
                                    n += 4;
                                }
                                break;
                            case 0x0c:
                                n += 2;
                                break;
                            case 0x14:
                                n += 5;
                                break;
                            case 0x05:
                                n += 4;
                                break;
                            case 0x00:
                            case 0x01:
                            case 0x02:
                            case 0x03:
                            case 0x06:
                            case 0x07:
                                break;
                            case 0x08:
                            case 0x09:
                            case 0x0a:
                            case 0x0b:
                            case 0x0d:
                            case 0x0e:
                            case 0x0f:
                                n++;
                                break;
                            case 0x10:
                            case 0x11:
                            case 0x12:
                            case 0x13:
                            case 0x15:
                            case 0x16:
                            case 0x17:
                                n += 4;
                                break;
                            }
                        } if (n > 15) Dc(6);
                    };
                    break Fd;
                case 0xa4:
                case 0xac:
                case 0xba:
                    {
                        {
                            if ((n + 1) > 15) Dc(6);
                            ia = (Ob + (n++)) >> 0;
                            Ha = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                        };
                        if (Ga & 0x0080) {
                            switch (Ha >> 6) {
                            case 0:
                                if ((Ha & 7) == 6) n += 2;
                                break;
                            case 1:
                                n++;
                                break;
                            case 2:
                                n += 2;
                                break;
                            case 3:
                            default:
                                break;
                            }
                        } else {
                            switch ((Ha & 7) | ((Ha >> 3) & 0x18)) {
                            case 0x04:
                                {
                                    if ((n + 1) > 15) Dc(6);
                                    ia = (Ob + (n++)) >> 0;
                                    Dd = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                                };
                                if ((Dd & 7) == 5) {
                                    n += 4;
                                }
                                break;
                            case 0x0c:
                                n += 2;
                                break;
                            case 0x14:
                                n += 5;
                                break;
                            case 0x05:
                                n += 4;
                                break;
                            case 0x00:
                            case 0x01:
                            case 0x02:
                            case 0x03:
                            case 0x06:
                            case 0x07:
                                break;
                            case 0x08:
                            case 0x09:
                            case 0x0a:
                            case 0x0b:
                            case 0x0d:
                            case 0x0e:
                            case 0x0f:
                                n++;
                                break;
                            case 0x10:
                            case 0x11:
                            case 0x12:
                            case 0x13:
                            case 0x15:
                            case 0x16:
                            case 0x17:
                                n += 4;
                                break;
                            }
                        } if (n > 15) Dc(6);
                    };
                    n++;
                    if (n > 15) Dc(6);
                    break Fd;
                case 0x04:
                case 0x05:
                case 0x07:
                case 0x08:
                case 0x09:
                case 0x0a:
                case 0x0b:
                case 0x0c:
                case 0x0d:
                case 0x0e:
                case 0x0f:
                case 0x10:
                case 0x11:
                case 0x12:
                case 0x13:
                case 0x14:
                case 0x15:
                case 0x16:
                case 0x17:
                case 0x18:
                case 0x19:
                case 0x1a:
                case 0x1b:
                case 0x1c:
                case 0x1d:
                case 0x1e:
                case 0x1f:
                case 0x21:
                case 0x24:
                case 0x25:
                case 0x26:
                case 0x27:
                case 0x28:
                case 0x29:
                case 0x2a:
                case 0x2b:
                case 0x2c:
                case 0x2d:
                case 0x2e:
                case 0x2f:
                case 0x30:
                case 0x32:
                case 0x33:
                case 0x34:
                case 0x35:
                case 0x36:
                case 0x37:
                case 0x38:
                case 0x39:
                case 0x3a:
                case 0x3b:
                case 0x3c:
                case 0x3d:
                case 0x3e:
                case 0x3f:
                case 0x50:
                case 0x51:
                case 0x52:
                case 0x53:
                case 0x54:
                case 0x55:
                case 0x56:
                case 0x57:
                case 0x58:
                case 0x59:
                case 0x5a:
                case 0x5b:
                case 0x5c:
                case 0x5d:
                case 0x5e:
                case 0x5f:
                case 0x60:
                case 0x61:
                case 0x62:
                case 0x63:
                case 0x64:
                case 0x65:
                case 0x66:
                case 0x67:
                case 0x68:
                case 0x69:
                case 0x6a:
                case 0x6b:
                case 0x6c:
                case 0x6d:
                case 0x6e:
                case 0x6f:
                case 0x70:
                case 0x71:
                case 0x72:
                case 0x73:
                case 0x74:
                case 0x75:
                case 0x76:
                case 0x77:
                case 0x78:
                case 0x79:
                case 0x7a:
                case 0x7b:
                case 0x7c:
                case 0x7d:
                case 0x7e:
                case 0x7f:
                case 0xa6:
                case 0xa7:
                case 0xaa:
                case 0xae:
                case 0xb8:
                case 0xb9:
                case 0xc2:
                case 0xc3:
                case 0xc4:
                case 0xc5:
                case 0xc6:
                case 0xc7:
                default:
                    Dc(6);
                }
                break;
            }
        }
        return n;
    }

    function gb(Gd, Hd, ma) {
        var Id, Jd, error_code, Kd, Ld, Md, Nd, ud, Od;
        if (!(za.cr0 & (1 << 31))) {
            za.tlb_set_page(Gd & -4096, Gd & -4096, 1);
        } else {
            Id = (za.cr3 & -4096) + ((Gd >> 20) & 0xffc);
            Jd = za.ld32_phys(Id);
            if (!(Jd & 0x00000001)) {
                error_code = 0;
            } else {
                if (!(Jd & 0x00000020)) {
                    Jd |= 0x00000020;
                    za.st32_phys(Id, Jd);
                }
                Kd = (Jd & -4096) + ((Gd >> 10) & 0xffc);
                Ld = za.ld32_phys(Kd);
                if (!(Ld & 0x00000001)) {
                    error_code = 0;
                } else {
                    Md = Ld & Jd;
                    if (ma && !(Md & 0x00000004)) {
                        error_code = 0x01;
                    } else if (Hd && !(Md & 0x00000002)) {
                        error_code = 0x01;
                    } else {
                        Nd = (Hd && !(Ld & 0x00000040));
                        if (!(Ld & 0x00000020) || Nd) {
                            Ld |= 0x00000020;
                            if (Nd) Ld |= 0x00000040;
                            za.st32_phys(Kd, Ld);
                        }
                        ud = 0;
                        if ((Ld & 0x00000040) && (Md & 0x00000002)) ud = 1;
                        Od = 0;
                        if (Md & 0x00000004) Od = 1;
                        za.tlb_set_page(Gd & -4096, Ld & -4096, ud, Od);
                        return;
                    }
                }
            }
            error_code |= Hd << 1;
            error_code |= ma << 2;
            za.cr2 = Gd;
            qd(14, error_code);
        }
    }

    function Pd(Qd) {
        if (!(Qd & (1 << 0))) nd("real mode not supported");
        if ((Qd & ((1 << 31) | (1 << 16) | (1 << 0))) != (za.cr0 & ((1 << 31) | (1 << 16) | (1 << 0)))) {
            za.tlb_flush_all();
        }
        za.cr0 = Qd | (1 << 4);
    }

    function Rd(Sd) {
        za.cr3 = Sd;
        if (za.cr0 & (1 << 31)) {
            za.tlb_flush_all();
        }
    }

    function Td(Ud) {
        za.cr4 = Ud;
    }

    function Vd(Wd) {
        if (Wd & (1 << 22)) return -1;
        else return 0xffff;
    }

    function Xd(selector) {
        var va, Sb, Yd, Wd;
        if (selector & 0x4) va = za.ldt;
        else va = za.gdt;
        Sb = selector & ~7;
        if ((Sb + 7) > va.limit) return null;
        ia = va.base + Sb;
        Yd = Db();
        ia += 4;
        Wd = Db();
        return [Yd, Wd];
    }

    function Zd(Yd, Wd) {
        var limit;
        limit = (Yd & 0xffff) | (Wd & 0x000f0000);
        if (Wd & (1 << 23)) limit = (limit << 12) | 0xfff;
        return limit;
    }

    function ae(Yd, Wd) {
        return (((Yd >>> 16) | ((Wd & 0xff) << 16) | (Wd & 0xff000000))) & -1;
    }

    function be(va, Yd, Wd) {
        va.base = ae(Yd, Wd);
        va.limit = Zd(Yd, Wd);
        va.flags = Wd;
    }

    function ce() {
        Qa = za.segs[1].base;
        Ra = za.segs[2].base;
        if (za.segs[2].flags & (1 << 22)) Sa = -1;
        else Sa = 0xffff;
        Ta = (((Qa | Ra | za.segs[3].base | za.segs[0].base) == 0) && Sa == -1);
        if (za.segs[1].flags & (1 << 22)) Ua = 0;
        else Ua = 0x0100 | 0x0080;
    }

    function de(ee, selector, base, limit, flags) {
        za.segs[ee] = {
            selector: selector,
            base: base,
            limit: limit,
            flags: flags
        };
        ce();
    }

    function fe(Tb, selector) {
        de(Tb, selector, (selector << 4), 0xffff, (1 << 15) | (3 << 13) | (1 << 12) | (1 << 8) | (1 << 12) | (1 << 9));
    }

    function ge(he) {
        var ie, Sb, je, ke, le;
        if (!(za.tr.flags & (1 << 15))) nd("invalid tss");
        ie = (za.tr.flags >> 8) & 0xf;
        if ((ie & 7) != 1) nd("invalid tss type");
        je = ie >> 3;
        Sb = (he * 4 + 2) << je;
        if (Sb + (4 << je) - 1 > za.tr.limit) qd(10, za.tr.selector & 0xfffc);
        ia = (za.tr.base + Sb) & -1;
        if (je == 0) {
            le = Bb();
            ia += 2;
        } else {
            le = Db();
            ia += 4;
        }
        ke = Bb();
        return [ke, le];
    }

    function me(intno, ne, error_code, oe, pe) {
        var va, qe, ie, he, selector, re, se;
        var te, ue, je;
        var e, Yd, Wd, ve, ke, le, we, xe;
        var ye, Sa;
        te = 0;
        if (!ne && !pe) {
            switch (intno) {
            case 8:
            case 10:
            case 11:
            case 12:
            case 13:
            case 14:
            case 17:
                te = 1;
                break;
            }
        }
        if (ne) ye = oe;
        else ye = Kb;
        va = za.idt;
        if (intno * 8 + 7 > va.limit) qd(13, intno * 8 + 2);
        ia = (va.base + intno * 8) & -1;
        Yd = Db();
        ia += 4;
        Wd = Db();
        ie = (Wd >> 8) & 0x1f;
        switch (ie) {
        case 5:
        case 7:
        case 6:
            throw "unsupported task gate";
        case 14:
        case 15:
            break;
        default:
            qd(13, intno * 8 + 2);
            break;
        }
        he = (Wd >> 13) & 3;
        se = za.cpl;
        if (ne && he < se) qd(13, intno * 8 + 2);
        if (!(Wd & (1 << 15))) qd(11, intno * 8 + 2);
        selector = Yd >> 16;
        ve = (Wd & -65536) | (Yd & 0x0000ffff);
        if ((selector & 0xfffc) == 0) qd(13, 0);
        e = Xd(selector);
        if (!e) qd(13, selector & 0xfffc);
        Yd = e[0];
        Wd = e[1];
        if (!(Wd & (1 << 12)) || !(Wd & ((1 << 11)))) qd(13, selector & 0xfffc);
        he = (Wd >> 13) & 3;
        if (he > se) qd(13, selector & 0xfffc);
        if (!(Wd & (1 << 15))) qd(11, selector & 0xfffc);
        if (!(Wd & (1 << 10)) && he < se) {
            e = ge(he);
            ke = e[0];
            le = e[1];
            if ((ke & 0xfffc) == 0) qd(10, ke & 0xfffc);
            if ((ke & 3) != he) qd(10, ke & 0xfffc);
            e = Xd(ke);
            if (!e) qd(10, ke & 0xfffc);
            we = e[0];
            xe = e[1];
            re = (xe >> 13) & 3;
            if (re != he) qd(10, ke & 0xfffc);
            if (!(xe & (1 << 12)) || (xe & (1 << 11)) || !(xe & (1 << 9))) qd(10, ke & 0xfffc);
            if (!(xe & (1 << 15))) qd(10, ke & 0xfffc);
            ue = 1;
            Sa = Vd(xe);
            qe = ae(we, xe);
        } else if ((Wd & (1 << 10)) || he == se) {
            if (za.eflags & 0x00020000) qd(13, selector & 0xfffc);
            ue = 0;
            Sa = Vd(za.segs[2].flags);
            qe = za.segs[2].base;
            le = Aa[4];
            he = se;
        } else {
            qd(13, selector & 0xfffc);
            ue = 0;
            Sa = 0;
            qe = 0;
            le = 0;
        }
        je = ie >> 3;
        if (je == 1) {
            if (ue) {
                if (za.eflags & 0x00020000) {
                    {
                        le = (le - 4) & -1;
                        ia = (qe + (le & Sa)) & -1;
                        Jb(za.segs[5].selector);
                    }; {
                        le = (le - 4) & -1;
                        ia = (qe + (le & Sa)) & -1;
                        Jb(za.segs[4].selector);
                    }; {
                        le = (le - 4) & -1;
                        ia = (qe + (le & Sa)) & -1;
                        Jb(za.segs[3].selector);
                    }; {
                        le = (le - 4) & -1;
                        ia = (qe + (le & Sa)) & -1;
                        Jb(za.segs[0].selector);
                    };
                } {
                    le = (le - 4) & -1;
                    ia = (qe + (le & Sa)) & -1;
                    Jb(za.segs[2].selector);
                }; {
                    le = (le - 4) & -1;
                    ia = (qe + (le & Sa)) & -1;
                    Jb(Aa[4]);
                };
            } {
                le = (le - 4) & -1;
                ia = (qe + (le & Sa)) & -1;
                Jb(id());
            }; {
                le = (le - 4) & -1;
                ia = (qe + (le & Sa)) & -1;
                Jb(za.segs[1].selector);
            }; {
                le = (le - 4) & -1;
                ia = (qe + (le & Sa)) & -1;
                Jb(ye);
            };
            if (te) {
                {
                    le = (le - 4) & -1;
                    ia = (qe + (le & Sa)) & -1;
                    Jb(error_code);
                };
            }
        } else {
            if (ue) {
                if (za.eflags & 0x00020000) {
                    {
                        le = (le - 2) & -1;
                        ia = (qe + (le & Sa)) & -1;
                        Hb(za.segs[5].selector);
                    }; {
                        le = (le - 2) & -1;
                        ia = (qe + (le & Sa)) & -1;
                        Hb(za.segs[4].selector);
                    }; {
                        le = (le - 2) & -1;
                        ia = (qe + (le & Sa)) & -1;
                        Hb(za.segs[3].selector);
                    }; {
                        le = (le - 2) & -1;
                        ia = (qe + (le & Sa)) & -1;
                        Hb(za.segs[0].selector);
                    };
                } {
                    le = (le - 2) & -1;
                    ia = (qe + (le & Sa)) & -1;
                    Hb(za.segs[2].selector);
                }; {
                    le = (le - 2) & -1;
                    ia = (qe + (le & Sa)) & -1;
                    Hb(Aa[4]);
                };
            } {
                le = (le - 2) & -1;
                ia = (qe + (le & Sa)) & -1;
                Hb(id());
            }; {
                le = (le - 2) & -1;
                ia = (qe + (le & Sa)) & -1;
                Hb(za.segs[1].selector);
            }; {
                le = (le - 2) & -1;
                ia = (qe + (le & Sa)) & -1;
                Hb(ye);
            };
            if (te) {
                {
                    le = (le - 2) & -1;
                    ia = (qe + (le & Sa)) & -1;
                    Hb(error_code);
                };
            }
        } if (ue) {
            if (za.eflags & 0x00020000) {
                de(0, 0, 0, 0, 0);
                de(3, 0, 0, 0, 0);
                de(4, 0, 0, 0, 0);
                de(5, 0, 0, 0, 0);
            }
            ke = (ke & ~3) | he;
            de(2, ke, qe, Zd(we, xe), xe);
        }
        Aa[4] = (Aa[4] & ~Sa) | ((le) & Sa);
        selector = (selector & ~3) | he;
        de(1, selector, ae(Yd, Wd), Zd(Yd, Wd), Wd);
        rd(he);
        Kb = ve, Lb = Nb = 0;
        if ((ie & 1) == 0) {
            za.eflags &= ~0x00000200;
        }
        za.eflags &= ~(0x00000100 | 0x00020000 | 0x00010000 | 0x00004000);
    }

    function ze(intno, ne, error_code, oe, pe) {
        var va, qe, selector, ve, le, ye;
        va = za.idt;
        if (intno * 4 + 3 > va.limit) qd(13, intno * 8 + 2);
        ia = (va.base + (intno << 2)) >> 0;
        ve = Bb();
        ia = (ia + 2) >> 0;
        selector = Bb();
        le = Aa[4];
        if (ne) ye = oe;
        else ye = Kb; {
            le = (le - 2) >> 0;
            ia = ((le & Sa) + Ra) >> 0;
            vb(id());
        }; {
            le = (le - 2) >> 0;
            ia = ((le & Sa) + Ra) >> 0;
            vb(za.segs[1].selector);
        }; {
            le = (le - 2) >> 0;
            ia = ((le & Sa) + Ra) >> 0;
            vb(ye);
        };
        Aa[4] = (Aa[4] & ~Sa) | ((le) & Sa);
        Kb = ve, Lb = Nb = 0;
        za.segs[1].selector = selector;
        za.segs[1].base = (selector << 4);
        za.eflags &= ~(0x00000200 | 0x00000100 | 0x00040000 | 0x00010000);
    }

    function Ae(intno, ne, error_code, oe, pe) {
        if (za.cr0 & (1 << 0)) {
            me(intno, ne, error_code, oe, pe);
        } else {
            ze(intno, ne, error_code, oe, pe);
        }
    }

    function Be(selector) {
        var va, Yd, Wd, Sb, Ce;
        selector &= 0xffff;
        if ((selector & 0xfffc) == 0) {
            za.ldt.base = 0;
            za.ldt.limit = 0;
        } else {
            if (selector & 0x4) qd(13, selector & 0xfffc);
            va = za.gdt;
            Sb = selector & ~7;
            Ce = 7;
            if ((Sb + Ce) > va.limit) qd(13, selector & 0xfffc);
            ia = (va.base + Sb) & -1;
            Yd = Db();
            ia += 4;
            Wd = Db();
            if ((Wd & (1 << 12)) || ((Wd >> 8) & 0xf) != 2) qd(13, selector & 0xfffc);
            if (!(Wd & (1 << 15))) qd(11, selector & 0xfffc);
            be(za.ldt, Yd, Wd);
        }
        za.ldt.selector = selector;
    }

    function De(selector) {
        var va, Yd, Wd, Sb, ie, Ce;
        selector &= 0xffff;
        if ((selector & 0xfffc) == 0) {
            za.tr.base = 0;
            za.tr.limit = 0;
            za.tr.flags = 0;
        } else {
            if (selector & 0x4) qd(13, selector & 0xfffc);
            va = za.gdt;
            Sb = selector & ~7;
            Ce = 7;
            if ((Sb + Ce) > va.limit) qd(13, selector & 0xfffc);
            ia = (va.base + Sb) & -1;
            Yd = Db();
            ia += 4;
            Wd = Db();
            ie = (Wd >> 8) & 0xf;
            if ((Wd & (1 << 12)) || (ie != 1 && ie != 9)) qd(13, selector & 0xfffc);
            if (!(Wd & (1 << 15))) qd(11, selector & 0xfffc);
            be(za.tr, Yd, Wd);
            Wd |= (1 << 9);
            Jb(Wd);
        }
        za.tr.selector = selector;
    }

    function Ee(Fe, selector) {
        var Yd, Wd, se, he, Ge, va, Sb;
        se = za.cpl;
        if ((selector & 0xfffc) == 0) {
            if (Fe == 2) qd(13, 0);
            de(Fe, selector, 0, 0, 0);
        } else {
            if (selector & 0x4) va = za.ldt;
            else va = za.gdt;
            Sb = selector & ~7;
            if ((Sb + 7) > va.limit) qd(13, selector & 0xfffc);
            ia = (va.base + Sb) & -1;
            Yd = Db();
            ia += 4;
            Wd = Db();
            if (!(Wd & (1 << 12))) qd(13, selector & 0xfffc);
            Ge = selector & 3;
            he = (Wd >> 13) & 3;
            if (Fe == 2) {
                if ((Wd & (1 << 11)) || !(Wd & (1 << 9))) qd(13, selector & 0xfffc);
                if (Ge != se || he != se) qd(13, selector & 0xfffc);
            } else {
                if ((Wd & ((1 << 11) | (1 << 9))) == (1 << 11)) qd(13, selector & 0xfffc);
                if (!(Wd & (1 << 11)) || !(Wd & (1 << 10))) {
                    if (he < se || he < Ge) qd(13, selector & 0xfffc);
                }
            } if (!(Wd & (1 << 15))) {
                if (Fe == 2) qd(12, selector & 0xfffc);
                else qd(11, selector & 0xfffc);
            }
            if (!(Wd & (1 << 8))) {
                Wd |= (1 << 8);
                Jb(Wd);
            }
            de(Fe, selector, ae(Yd, Wd), Zd(Yd, Wd), Wd);
        }
    }

    function He(Fe, selector) {
        var va;
        selector &= 0xffff;
        if (!(za.cr0 & (1 << 0))) {
            va = za.segs[Fe];
            va.selector = selector;
            va.base = selector << 4;
        } else if (za.eflags & 0x00020000) {
            fe(Fe, selector);
        } else {
            Ee(Fe, selector);
        }
    }

    function Ie(Je, Ke) {
        Kb = Ke, Lb = Nb = 0;
        za.segs[1].selector = Je;
        za.segs[1].base = (Je << 4);
        ce();
    }

    function Le(Je, Ke) {
        var Me, ie, Yd, Wd, se, he, Ge, limit, e;
        if ((Je & 0xfffc) == 0) qd(13, 0);
        e = Xd(Je);
        if (!e) qd(13, Je & 0xfffc);
        Yd = e[0];
        Wd = e[1];
        se = za.cpl;
        if (Wd & (1 << 12)) {
            if (!(Wd & (1 << 11))) qd(13, Je & 0xfffc);
            he = (Wd >> 13) & 3;
            if (Wd & (1 << 10)) {
                if (he > se) qd(13, Je & 0xfffc);
            } else {
                Ge = Je & 3;
                if (Ge > se) qd(13, Je & 0xfffc);
                if (he != se) qd(13, Je & 0xfffc);
            } if (!(Wd & (1 << 15))) qd(11, Je & 0xfffc);
            limit = Zd(Yd, Wd);
            if ((Ke >>> 0) > (limit >>> 0)) qd(13, Je & 0xfffc);
            de(1, (Je & 0xfffc) | se, ae(Yd, Wd), limit, Wd);
            Kb = Ke, Lb = Nb = 0;
        } else {
            nd("unsupported jump to call or task gate");
        }
    }

    function Ne(Je, Ke) {
        if (!(za.cr0 & (1 << 0)) || (za.eflags & 0x00020000)) {
            Ie(Je, Ke);
        } else {
            Le(Je, Ke);
        }
    }

    function Oe(Fe, se) {
        var he, Wd;
        if ((Fe == 4 || Fe == 5) && (za.segs[Fe].selector & 0xfffc) == 0) return;
        Wd = za.segs[Fe].flags;
        he = (Wd >> 13) & 3;
        if (!(Wd & (1 << 11)) || !(Wd & (1 << 10))) {
            if (he < se) {
                de(Fe, 0, 0, 0, 0);
            }
        }
    }

    function Pe(je, Je, Ke, oe) {
        var le;
        le = Aa[4];
        if (je) {
            {
                le = (le - 4) >> 0;
                ia = ((le & Sa) + Ra) >> 0;
                xb(za.segs[1].selector);
            }; {
                le = (le - 4) >> 0;
                ia = ((le & Sa) + Ra) >> 0;
                xb(oe);
            };
        } else {
            {
                le = (le - 2) >> 0;
                ia = ((le & Sa) + Ra) >> 0;
                vb(za.segs[1].selector);
            }; {
                le = (le - 2) >> 0;
                ia = ((le & Sa) + Ra) >> 0;
                vb(oe);
            };
        }
        Aa[4] = (Aa[4] & ~Sa) | ((le) & Sa);
        Kb = Ke, Lb = Nb = 0;
        za.segs[1].selector = Je;
        za.segs[1].base = (Je << 4);
        ce();
    }

    function Qe(je, Je, Ke, oe) {
        var ue, i, e;
        var Yd, Wd, se, he, Ge, selector, ve, Re;
        var ke, we, xe, Se, ie, re, Sa;
        var ja, limit, Te;
        var qe, Ue, Ve;
        if ((Je & 0xfffc) == 0) qd(13, 0);
        e = Xd(Je);
        if (!e) qd(13, Je & 0xfffc);
        Yd = e[0];
        Wd = e[1];
        se = za.cpl;
        Ve = Aa[4];
        if (Wd & (1 << 12)) {
            if (!(Wd & (1 << 11))) qd(13, Je & 0xfffc);
            he = (Wd >> 13) & 3;
            if (Wd & (1 << 10)) {
                if (he > se) qd(13, Je & 0xfffc);
            } else {
                Ge = Je & 3;
                if (Ge > se) qd(13, Je & 0xfffc);
                if (he != se) qd(13, Je & 0xfffc);
            } if (!(Wd & (1 << 15))) qd(11, Je & 0xfffc); {
                Se = Ve;
                Sa = Vd(za.segs[2].flags);
                qe = za.segs[2].base;
                if (je) {
                    {
                        Se = (Se - 4) & -1;
                        ia = (qe + (Se & Sa)) & -1;
                        Jb(za.segs[1].selector);
                    }; {
                        Se = (Se - 4) & -1;
                        ia = (qe + (Se & Sa)) & -1;
                        Jb(oe);
                    };
                } else {
                    {
                        Se = (Se - 2) & -1;
                        ia = (qe + (Se & Sa)) & -1;
                        Hb(za.segs[1].selector);
                    }; {
                        Se = (Se - 2) & -1;
                        ia = (qe + (Se & Sa)) & -1;
                        Hb(oe);
                    };
                }
                limit = Zd(Yd, Wd);
                if (Ke > limit) qd(13, Je & 0xfffc);
                Aa[4] = (Aa[4] & ~Sa) | ((Se) & Sa);
                de(1, (Je & 0xfffc) | se, ae(Yd, Wd), limit, Wd);
                Kb = Ke, Lb = Nb = 0;
            }
        } else {
            ie = (Wd >> 8) & 0x1f;
            he = (Wd >> 13) & 3;
            Ge = Je & 3;
            switch (ie) {
            case 1:
            case 9:
            case 5:
                throw "unsupported task gate";
                return;
            case 4:
            case 12:
                break;
            default:
                qd(13, Je & 0xfffc);
                break;
            }
            je = ie >> 3;
            if (he < se || he < Ge) qd(13, Je & 0xfffc);
            if (!(Wd & (1 << 15))) qd(11, Je & 0xfffc);
            selector = Yd >> 16;
            ve = (Wd & 0xffff0000) | (Yd & 0x0000ffff);
            Re = Wd & 0x1f;
            if ((selector & 0xfffc) == 0) qd(13, 0);
            e = Xd(selector);
            if (!e) qd(13, selector & 0xfffc);
            Yd = e[0];
            Wd = e[1];
            if (!(Wd & (1 << 12)) || !(Wd & ((1 << 11)))) qd(13, selector & 0xfffc);
            he = (Wd >> 13) & 3;
            if (he > se) qd(13, selector & 0xfffc);
            if (!(Wd & (1 << 15))) qd(11, selector & 0xfffc);
            if (!(Wd & (1 << 10)) && he < se) {
                e = ge(he);
                ke = e[0];
                Se = e[1];
                if ((ke & 0xfffc) == 0) qd(10, ke & 0xfffc);
                if ((ke & 3) != he) qd(10, ke & 0xfffc);
                e = Xd(ke);
                if (!e) qd(10, ke & 0xfffc);
                we = e[0];
                xe = e[1];
                re = (xe >> 13) & 3;
                if (re != he) qd(10, ke & 0xfffc);
                if (!(xe & (1 << 12)) || (xe & (1 << 11)) || !(xe & (1 << 9))) qd(10, ke & 0xfffc);
                if (!(xe & (1 << 15))) qd(10, ke & 0xfffc);
                Te = Vd(za.segs[2].flags);
                Ue = za.segs[2].base;
                Sa = Vd(xe);
                qe = ae(we, xe);
                if (je) {
                    {
                        Se = (Se - 4) & -1;
                        ia = (qe + (Se & Sa)) & -1;
                        Jb(za.segs[2].selector);
                    }; {
                        Se = (Se - 4) & -1;
                        ia = (qe + (Se & Sa)) & -1;
                        Jb(Ve);
                    };
                    for (i = Re - 1; i >= 0; i--) {
                        ja = Db(Ue + ((Ve + i * 4) & Te)); {
                            Se = (Se - 4) & -1;
                            ia = (qe + (Se & Sa)) & -1;
                            Jb(ja);
                        };
                    }
                } else {
                    {
                        Se = (Se - 2) & -1;
                        ia = (qe + (Se & Sa)) & -1;
                        Hb(za.segs[2].selector);
                    }; {
                        Se = (Se - 2) & -1;
                        ia = (qe + (Se & Sa)) & -1;
                        Hb(Ve);
                    };
                    for (i = Re - 1; i >= 0; i--) {
                        ja = Bb(Ue + ((Ve + i * 2) & Te)); {
                            Se = (Se - 2) & -1;
                            ia = (qe + (Se & Sa)) & -1;
                            Hb(ja);
                        };
                    }
                }
                ue = 1;
            } else {
                Se = Ve;
                Sa = Vd(za.segs[2].flags);
                qe = za.segs[2].base;
                ue = 0;
            } if (je) {
                {
                    Se = (Se - 4) & -1;
                    ia = (qe + (Se & Sa)) & -1;
                    Jb(za.segs[1].selector);
                }; {
                    Se = (Se - 4) & -1;
                    ia = (qe + (Se & Sa)) & -1;
                    Jb(oe);
                };
            } else {
                {
                    Se = (Se - 2) & -1;
                    ia = (qe + (Se & Sa)) & -1;
                    Hb(za.segs[1].selector);
                }; {
                    Se = (Se - 2) & -1;
                    ia = (qe + (Se & Sa)) & -1;
                    Hb(oe);
                };
            } if (ue) {
                ke = (ke & ~3) | he;
                de(2, ke, qe, Zd(we, xe), xe);
            }
            selector = (selector & ~3) | he;
            de(1, selector, ae(Yd, Wd), Zd(Yd, Wd), Wd);
            rd(he);
            Aa[4] = (Aa[4] & ~Sa) | ((Se) & Sa);
            Kb = ve, Lb = Nb = 0;
        }
    }

    function We(je, Je, Ke, oe) {
        if (!(za.cr0 & (1 << 0)) || (za.eflags & 0x00020000)) {
            Pe(je, Je, Ke, oe);
        } else {
            Qe(je, Je, Ke, oe);
        }
    }

    function Xe(je, Ye, Ze) {
        var Se, Je, Ke, af, Sa, qe, bf;
        Sa = 0xffff;
        Se = Aa[4];
        qe = za.segs[2].base;
        if (je == 1) {
            {
                ia = (qe + (Se & Sa)) & -1;
                Ke = Db();
                Se = (Se + 4) & -1;
            }; {
                ia = (qe + (Se & Sa)) & -1;
                Je = Db();
                Se = (Se + 4) & -1;
            };
            Je &= 0xffff;
            if (Ye) {
                ia = (qe + (Se & Sa)) & -1;
                af = Db();
                Se = (Se + 4) & -1;
            };
        } else {
            {
                ia = (qe + (Se & Sa)) & -1;
                Ke = Bb();
                Se = (Se + 2) & -1;
            }; {
                ia = (qe + (Se & Sa)) & -1;
                Je = Bb();
                Se = (Se + 2) & -1;
            }; if (Ye) {
                ia = (qe + (Se & Sa)) & -1;
                af = Bb();
                Se = (Se + 2) & -1;
            };
        }
        Aa[4] = (Aa[4] & ~Sa) | ((Se + Ze) & Sa);
        za.segs[1].selector = Je;
        za.segs[1].base = (Je << 4);
        Kb = Ke, Lb = Nb = 0;
        if (Ye) {
            if (za.eflags & 0x00020000) bf = 0x00000100 | 0x00040000 | 0x00200000 | 0x00000200 | 0x00010000 | 0x00004000;
            else bf = 0x00000100 | 0x00040000 | 0x00200000 | 0x00000200 | 0x00003000 | 0x00010000 | 0x00004000; if (je == 0) bf &= 0xffff;
            kd(af, bf);
        }
        ce();
    }

    function cf(je, Ye, Ze) {
        var Je, af, df;
        var ef, ff, gf, hf;
        var e, Yd, Wd, we, xe;
        var se, he, Ge, bf, Va;
        var qe, Se, Ke, wd, Sa;
        Sa = Vd(za.segs[2].flags);
        Se = Aa[4];
        qe = za.segs[2].base;
        af = 0;
        if (je == 1) {
            {
                ia = (qe + (Se & Sa)) & -1;
                Ke = Db();
                Se = (Se + 4) & -1;
            }; {
                ia = (qe + (Se & Sa)) & -1;
                Je = Db();
                Se = (Se + 4) & -1;
            };
            Je &= 0xffff;
            if (Ye) {
                {
                    ia = (qe + (Se & Sa)) & -1;
                    af = Db();
                    Se = (Se + 4) & -1;
                };
                if (af & 0x00020000) {
                    {
                        ia = (qe + (Se & Sa)) & -1;
                        wd = Db();
                        Se = (Se + 4) & -1;
                    }; {
                        ia = (qe + (Se & Sa)) & -1;
                        df = Db();
                        Se = (Se + 4) & -1;
                    }; {
                        ia = (qe + (Se & Sa)) & -1;
                        ef = Db();
                        Se = (Se + 4) & -1;
                    }; {
                        ia = (qe + (Se & Sa)) & -1;
                        ff = Db();
                        Se = (Se + 4) & -1;
                    }; {
                        ia = (qe + (Se & Sa)) & -1;
                        gf = Db();
                        Se = (Se + 4) & -1;
                    }; {
                        ia = (qe + (Se & Sa)) & -1;
                        hf = Db();
                        Se = (Se + 4) & -1;
                    };
                    kd(af, 0x00000100 | 0x00040000 | 0x00200000 | 0x00000200 | 0x00003000 | 0x00020000 | 0x00004000 | 0x00080000 | 0x00100000);
                    fe(1, Je & 0xffff);
                    rd(3);
                    fe(2, df & 0xffff);
                    fe(0, ef & 0xffff);
                    fe(3, ff & 0xffff);
                    fe(4, gf & 0xffff);
                    fe(5, hf & 0xffff);
                    Kb = Ke & 0xffff, Lb = Nb = 0;
                    Aa[4] = (Aa[4] & ~Sa) | ((wd) & Sa);
                    return;
                }
            }
        } else {
            {
                ia = (qe + (Se & Sa)) & -1;
                Ke = Bb();
                Se = (Se + 2) & -1;
            }; {
                ia = (qe + (Se & Sa)) & -1;
                Je = Bb();
                Se = (Se + 2) & -1;
            }; if (Ye) {
                ia = (qe + (Se & Sa)) & -1;
                af = Bb();
                Se = (Se + 2) & -1;
            };
        } if ((Je & 0xfffc) == 0) qd(13, Je & 0xfffc);
        e = Xd(Je);
        if (!e) qd(13, Je & 0xfffc);
        Yd = e[0];
        Wd = e[1];
        if (!(Wd & (1 << 12)) || !(Wd & (1 << 11))) qd(13, Je & 0xfffc);
        se = za.cpl;
        Ge = Je & 3;
        if (Ge < se) qd(13, Je & 0xfffc);
        he = (Wd >> 13) & 3;
        if (Wd & (1 << 10)) {
            if (he > Ge) qd(13, Je & 0xfffc);
        } else {
            if (he != Ge) qd(13, Je & 0xfffc);
        } if (!(Wd & (1 << 15))) qd(11, Je & 0xfffc);
        Se = (Se + Ze) & -1;
        if (Ge == se) {
            de(1, Je, ae(Yd, Wd), Zd(Yd, Wd), Wd);
        } else {
            if (je == 1) {
                {
                    ia = (qe + (Se & Sa)) & -1;
                    wd = Db();
                    Se = (Se + 4) & -1;
                }; {
                    ia = (qe + (Se & Sa)) & -1;
                    df = Db();
                    Se = (Se + 4) & -1;
                };
                df &= 0xffff;
            } else {
                {
                    ia = (qe + (Se & Sa)) & -1;
                    wd = Bb();
                    Se = (Se + 2) & -1;
                }; {
                    ia = (qe + (Se & Sa)) & -1;
                    df = Bb();
                    Se = (Se + 2) & -1;
                };
            } if ((df & 0xfffc) == 0) {
                qd(13, 0);
            } else {
                if ((df & 3) != Ge) qd(13, df & 0xfffc);
                e = Xd(df);
                if (!e) qd(13, df & 0xfffc);
                we = e[0];
                xe = e[1];
                if (!(xe & (1 << 12)) || (xe & (1 << 11)) || !(xe & (1 << 9))) qd(13, df & 0xfffc);
                he = (xe >> 13) & 3;
                if (he != Ge) qd(13, df & 0xfffc);
                if (!(xe & (1 << 15))) qd(11, df & 0xfffc);
                de(2, df, ae(we, xe), Zd(we, xe), xe);
            }
            de(1, Je, ae(Yd, Wd), Zd(Yd, Wd), Wd);
            rd(Ge);
            Se = wd;
            Sa = Vd(xe);
            Oe(0, Ge);
            Oe(3, Ge);
            Oe(4, Ge);
            Oe(5, Ge);
            Se = (Se + Ze) & -1;
        }
        Aa[4] = (Aa[4] & ~Sa) | ((Se) & Sa);
        Kb = Ke, Lb = Nb = 0;
        if (Ye) {
            bf = 0x00000100 | 0x00040000 | 0x00200000 | 0x00010000 | 0x00004000;
            if (se == 0) bf |= 0x00003000;
            Va = (za.eflags >> 12) & 3;
            if (se <= Va) bf |= 0x00000200;
            if (je == 0) bf &= 0xffff;
            kd(af, bf);
        }
    }

    function jf(je) {
        var Va;
        if (!(za.cr0 & (1 << 0)) || (za.eflags & 0x00020000)) {
            if (za.eflags & 0x00020000) {
                Va = (za.eflags >> 12) & 3;
                if (Va != 3) Dc(13);
            }
            Xe(je, 1, 0);
        } else {
            if (za.eflags & 0x00004000) {
                throw "unsupported task gate";
            } else {
                cf(je, 1, 0);
            }
        }
    }

    function kf(je, Ze) {
        if (!(za.cr0 & (1 << 0)) || (za.eflags & 0x00020000)) {
            Xe(je, 0, Ze);
        } else {
            cf(je, 0, Ze);
        }
    }

    function lf(selector, mf) {
        var e, Yd, Wd, Ge, he, se, ie;
        if ((selector & 0xfffc) == 0) return null;
        e = Xd(selector);
        if (!e) return null;
        Yd = e[0];
        Wd = e[1];
        Ge = selector & 3;
        he = (Wd >> 13) & 3;
        se = za.cpl;
        if (Wd & (1 << 12)) {
            if ((Wd & (1 << 11)) && (Wd & (1 << 10))) {} else {
                if (he < se || he < Ge) return null;
            }
        } else {
            ie = (Wd >> 8) & 0xf;
            switch (ie) {
            case 1:
            case 2:
            case 3:
            case 9:
            case 11:
                break;
            case 4:
            case 5:
            case 12:
                if (mf) return null;
                break;
            default:
                return null;
            }
            if (he < se || he < Ge) return null;
        } if (mf) {
            return Zd(Yd, Wd);
        } else {
            return Wd & 0x00f0ff00;
        }
    }

    function nf(je, mf) {
        var ja, Ha, Ja, selector;
        if (!(za.cr0 & (1 << 0)) || (za.eflags & 0x00020000)) Dc(6);
        Ha = Wa[Lb++];;
        Ja = (Ha >> 3) & 7;
        if ((Ha >> 6) == 3) {
            selector = Aa[Ha & 7] & 0xffff;
        } else {
            ia = Qb(Ha);
            selector = jb();
        }
        ja = lf(selector, mf);
        Ba = hd();
        if (ja === null) {
            Ba &= ~0x0040;
        } else {
            Ba |= 0x0040;
            if (je) Aa[Ja] = ja;
            else Xb(Ja, ja);
        }
        Ca = ((Ba >> 6) & 1) ^ 1;
        Da = 24;
    }

    function of(selector, ud) {
        var e, Yd, Wd, Ge, he, se;
        if ((selector & 0xfffc) == 0) return 0;
        e = Xd(selector);
        if (!e) return 0;
        Yd = e[0];
        Wd = e[1];
        if (!(Wd & (1 << 12))) return 0;
        Ge = selector & 3;
        he = (Wd >> 13) & 3;
        se = za.cpl;
        if (Wd & (1 << 11)) {
            if (ud) {
                return 0;
            } else {
                if (!(Wd & (1 << 9))) return 1;
                if (!(Wd & (1 << 10))) {
                    if (he < se || he < Ge) return 0;
                }
            }
        } else {
            if (he < se || he < Ge) return 0;
            if (ud && !(Wd & (1 << 9))) return 0;
        }
        return 1;
    }

    function pf(selector, ud) {
        var z;
        z = of(selector, ud);
        Ba = hd();
        if (z) Ba |= 0x0040;
        else Ba &= ~0x0040;
        Ca = ((Ba >> 6) & 1) ^ 1;
        Da = 24;
    }

    function qf() {
        var Ha, ja, Ka, Ia;
        if (!(za.cr0 & (1 << 0)) || (za.eflags & 0x00020000)) Dc(6);
        Ha = Wa[Lb++];;
        if ((Ha >> 6) == 3) {
            Ia = Ha & 7;
            ja = Aa[Ia] & 0xffff;
        } else {
            ia = Qb(Ha);
            ja = pb();
        }
        Ka = Aa[(Ha >> 3) & 7];
        Ba = hd();
        if ((ja & 3) < (Ka & 3)) {
            ja = (ja & ~3) | (Ka & 3);
            if ((Ha >> 6) == 3) {
                Xb(Ia, ja);
            } else {
                vb(ja);
            }
            Ba |= 0x0040;
        } else {
            Ba &= ~0x0040;
        }
        Ca = ((Ba >> 6) & 1) ^ 1;
        Da = 24;
    }

    function rf() {
        var Sb;
        Sb = Aa[0];
        switch (Sb) {
        case 0:
            Aa[0] = 1;
            Aa[3] = 0x756e6547 & -1;
            Aa[2] = 0x49656e69 & -1;
            Aa[1] = 0x6c65746e & -1;
            break;
        case 1:
        default:
            Aa[0] = (5 << 8) | (4 << 4) | 3;
            Aa[3] = 8 << 8;
            Aa[1] = 0;
            Aa[2] = (1 << 4);
            break;
        }
    }

    function sf(base) {
        var tf, uf;
        if (base == 0) Dc(0);
        tf = Aa[0] & 0xff;
        uf = (tf / base) & -1;
        tf = (tf % base);
        Aa[0] = (Aa[0] & ~0xffff) | tf | (uf << 8);
        Ca = (((tf) << 24) >> 24);
        Da = 12;
    }

    function vf(base) {
        var tf, uf;
        tf = Aa[0] & 0xff;
        uf = (Aa[0] >> 8) & 0xff;
        tf = (uf * base + tf) & 0xff;
        Aa[0] = (Aa[0] & ~0xffff) | tf;
        Ca = (((tf) << 24) >> 24);
        Da = 12;
    }

    function wf() {
        var xf, tf, uf, yf, jd;
        jd = hd();
        yf = jd & 0x0010;
        tf = Aa[0] & 0xff;
        uf = (Aa[0] >> 8) & 0xff;
        xf = (tf > 0xf9);
        if (((tf & 0x0f) > 9) || yf) {
            tf = (tf + 6) & 0x0f;
            uf = (uf + 1 + xf) & 0xff;
            jd |= 0x0001 | 0x0010;
        } else {
            jd &= ~(0x0001 | 0x0010);
            tf &= 0x0f;
        }
        Aa[0] = (Aa[0] & ~0xffff) | tf | (uf << 8);
        Ba = jd;
        Ca = ((Ba >> 6) & 1) ^ 1;
        Da = 24;
    }

    function zf() {
        var xf, tf, uf, yf, jd;
        jd = hd();
        yf = jd & 0x0010;
        tf = Aa[0] & 0xff;
        uf = (Aa[0] >> 8) & 0xff;
        xf = (tf < 6);
        if (((tf & 0x0f) > 9) || yf) {
            tf = (tf - 6) & 0x0f;
            uf = (uf - 1 - xf) & 0xff;
            jd |= 0x0001 | 0x0010;
        } else {
            jd &= ~(0x0001 | 0x0010);
            tf &= 0x0f;
        }
        Aa[0] = (Aa[0] & ~0xffff) | tf | (uf << 8);
        Ba = jd;
        Ca = ((Ba >> 6) & 1) ^ 1;
        Da = 24;
    }

    function Af() {
        var tf, yf, Bf, jd;
        jd = hd();
        Bf = jd & 0x0001;
        yf = jd & 0x0010;
        tf = Aa[0] & 0xff;
        jd = 0;
        if (((tf & 0x0f) > 9) || yf) {
            tf = (tf + 6) & 0xff;
            jd |= 0x0010;
        }
        if ((tf > 0x9f) || Bf) {
            tf = (tf + 0x60) & 0xff;
            jd |= 0x0001;
        }
        Aa[0] = (Aa[0] & ~0xff) | tf;
        jd |= (tf == 0) << 6;
        jd |= aa[tf] << 2;
        jd |= (tf & 0x80);
        Ba = jd;
        Ca = ((Ba >> 6) & 1) ^ 1;
        Da = 24;
    }

    function Cf() {
        var tf, Df, yf, Bf, jd;
        jd = hd();
        Bf = jd & 0x0001;
        yf = jd & 0x0010;
        tf = Aa[0] & 0xff;
        jd = 0;
        Df = tf;
        if (((tf & 0x0f) > 9) || yf) {
            jd |= 0x0010;
            if (tf < 6 || Bf) jd |= 0x0001;
            tf = (tf - 6) & 0xff;
        }
        if ((Df > 0x99) || Bf) {
            tf = (tf - 0x60) & 0xff;
            jd |= 0x0001;
        }
        Aa[0] = (Aa[0] & ~0xff) | tf;
        jd |= (tf == 0) << 6;
        jd |= aa[tf] << 2;
        jd |= (tf & 0x80);
        Ba = jd;
        Ca = ((Ba >> 6) & 1) ^ 1;
        Da = 24;
    }

    function Ef() {
        var Ha, ja, Ka, La;
        Ha = Wa[Lb++];;
        if ((Ha >> 3) == 3) Dc(6);
        ia = Qb(Ha);
        ja = lb();
        ia = (ia + 4) & -1;
        Ka = lb();
        Ja = (Ha >> 3) & 7;
        La = Aa[Ja];
        if (La < ja || La > Ka) Dc(5);
    }

    function Ff() {
        var Ha, ja, Ka, La;
        Ha = Wa[Lb++];;
        if ((Ha >> 3) == 3) Dc(6);
        ia = Qb(Ha);
        ja = (jb() << 16) >> 16;
        ia = (ia + 2) & -1;
        Ka = (jb() << 16) >> 16;
        Ja = (Ha >> 3) & 7;
        La = (Aa[Ja] << 16) >> 16;
        if (La < ja || La > Ka) Dc(5);
    }

    function Gf() {
        var ja, Ka, Ja;
        Ka = (Aa[4] - 16) >> 0;
        ia = ((Ka & Sa) + Ra) >> 0;
        for (Ja = 7; Ja >= 0; Ja--) {
            ja = Aa[Ja];
            vb(ja);
            ia = (ia + 2) >> 0;
        }
        Aa[4] = (Aa[4] & ~Sa) | ((Ka) & Sa);
    }

    function Hf() {
        var ja, Ka, Ja;
        Ka = (Aa[4] - 32) >> 0;
        ia = ((Ka & Sa) + Ra) >> 0;
        for (Ja = 7; Ja >= 0; Ja--) {
            ja = Aa[Ja];
            xb(ja);
            ia = (ia + 4) >> 0;
        }
        Aa[4] = (Aa[4] & ~Sa) | ((Ka) & Sa);
    }

    function If() {
        var Ja;
        ia = ((Aa[4] & Sa) + Ra) >> 0;
        for (Ja = 7; Ja >= 0; Ja--) {
            if (Ja != 4) {
                Xb(Ja, jb());
            }
            ia = (ia + 2) >> 0;
        }
        Aa[4] = (Aa[4] & ~Sa) | ((Aa[4] + 16) & Sa);
    }

    function Jf() {
        var Ja;
        ia = ((Aa[4] & Sa) + Ra) >> 0;
        for (Ja = 7; Ja >= 0; Ja--) {
            if (Ja != 4) {
                Aa[Ja] = lb();
            }
            ia = (ia + 4) >> 0;
        }
        Aa[4] = (Aa[4] & ~Sa) | ((Aa[4] + 32) & Sa);
    }

    function Kf() {
        var ja, Ka;
        Ka = Aa[5];
        ia = ((Ka & Sa) + Ra) >> 0;
        ja = jb();
        Xb(5, ja);
        Aa[4] = (Aa[4] & ~Sa) | ((Ka + 2) & Sa);
    }

    function Lf() {
        var ja, Ka;
        Ka = Aa[5];
        ia = ((Ka & Sa) + Ra) >> 0;
        ja = lb();
        Aa[5] = ja;
        Aa[4] = (Aa[4] & ~Sa) | ((Ka + 4) & Sa);
    }

    function Mf() {
        var Ze, Nf, le, Of, ja, Pf;
        Ze = Pb();
        Nf = Wa[Lb++];;
        Nf &= 0x1f;
        le = Aa[4];
        Of = Aa[5]; {
            le = (le - 2) >> 0;
            ia = ((le & Sa) + Ra) >> 0;
            vb(Of);
        };
        Pf = le;
        if (Nf != 0) {
            while (Nf > 1) {
                Of = (Of - 2) >> 0;
                ia = ((Of & Sa) + Ra) >> 0;
                ja = jb(); {
                    le = (le - 2) >> 0;
                    ia = ((le & Sa) + Ra) >> 0;
                    vb(ja);
                };
                Nf--;
            } {
                le = (le - 2) >> 0;
                ia = ((le & Sa) + Ra) >> 0;
                vb(Pf);
            };
        }
        le = (le - Ze) >> 0;
        ia = ((le & Sa) + Ra) >> 0;
        pb();
        Aa[5] = (Aa[5] & ~Sa) | (Pf & Sa);
        Aa[4] = le;
    }

    function Qf() {
        var Ze, Nf, le, Of, ja, Pf;
        Ze = Pb();
        Nf = Wa[Lb++];;
        Nf &= 0x1f;
        le = Aa[4];
        Of = Aa[5]; {
            le = (le - 4) >> 0;
            ia = ((le & Sa) + Ra) >> 0;
            xb(Of);
        };
        Pf = le;
        if (Nf != 0) {
            while (Nf > 1) {
                Of = (Of - 4) >> 0;
                ia = ((Of & Sa) + Ra) >> 0;
                ja = lb(); {
                    le = (le - 4) >> 0;
                    ia = ((le & Sa) + Ra) >> 0;
                    xb(ja);
                };
                Nf--;
            } {
                le = (le - 4) >> 0;
                ia = ((le & Sa) + Ra) >> 0;
                xb(Pf);
            };
        }
        le = (le - Ze) >> 0;
        ia = ((le & Sa) + Ra) >> 0;
        rb();
        Aa[5] = (Aa[5] & ~Sa) | (Pf & Sa);
        Aa[4] = (Aa[4] & ~Sa) | ((le) & Sa);
    }

    function Rf(Tb) {
        var ja, Ka, Ha;
        Ha = Wa[Lb++];;
        if ((Ha >> 3) == 3) Dc(6);
        ia = Qb(Ha);
        ja = lb();
        ia += 4;
        Ka = jb();
        He(Tb, Ka);
        Aa[(Ha >> 3) & 7] = ja;
    }

    function Sf(Tb) {
        var ja, Ka, Ha;
        Ha = Wa[Lb++];;
        if ((Ha >> 3) == 3) Dc(6);
        ia = Qb(Ha);
        ja = jb();
        ia += 2;
        Ka = jb();
        He(Tb, Ka);
        Xb((Ha >> 3) & 7, ja);
    }

    function Tf() {
        var Uf, Vf, Wf, Xf, Va, ja;
        Va = (za.eflags >> 12) & 3;
        if (za.cpl > Va) Dc(13);
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Vf = Aa[7];
        Wf = Aa[2] & 0xffff;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;; {
                ja = za.ld8_port(Wf);
                ia = ((Vf & Uf) + za.segs[0].base) >> 0;
                tb(ja);
                Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 0)) & Uf);
                Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
                if (Xf & Uf) Lb = Nb;;
            }
        } else {
            ja = za.ld8_port(Wf);
            ia = ((Vf & Uf) + za.segs[0].base) >> 0;
            tb(ja);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 0)) & Uf);
        }
    }

    function Yf() {
        var Uf, Zf, Tb, Xf, Wf, Va, ja;
        Va = (za.eflags >> 12) & 3;
        if (za.cpl > Va) Dc(13);
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        Wf = Aa[2] & 0xffff;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
            ja = hb();
            za.st8_port(Wf, ja);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 0)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Xf & Uf) Lb = Nb;;
        } else {
            ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
            ja = hb();
            za.st8_port(Wf, ja);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 0)) & Uf);
        }
    }

    function ag() {
        var Uf, Vf, Zf, Xf, Tb, bg;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        Vf = Aa[7];
        ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
        bg = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;; {
                ja = hb();
                ia = bg;
                tb(ja);
                Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 0)) & Uf);
                Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 0)) & Uf);
                Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
                if (Xf & Uf) Lb = Nb;;
            }
        } else {
            ja = hb();
            ia = bg;
            tb(ja);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 0)) & Uf);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 0)) & Uf);
        }
    }

    function cg() {
        var Uf, Vf, Xf;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Vf = Aa[7];
        ia = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;; {
                tb(Aa[0]);
                Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 0)) & Uf);
                Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
                if (Xf & Uf) Lb = Nb;;
            }
        } else {
            tb(Aa[0]);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 0)) & Uf);
        }
    }

    function dg() {
        var Uf, Vf, Zf, Xf, Tb, bg;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        Vf = Aa[7];
        ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
        bg = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ja = hb();
            ia = bg;
            Ka = hb();
            gc(7, ja, Ka);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 0)) & Uf);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 0)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Ga & 0x0010) {
                if (!(Ca == 0)) return;
            } else {
                if ((Ca == 0)) return;
            } if (Xf & Uf) Lb = Nb;;
        } else {
            ja = hb();
            ia = bg;
            Ka = hb();
            gc(7, ja, Ka);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 0)) & Uf);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 0)) & Uf);
        }
    }

    function eg() {
        var Uf, Zf, Tb, Xf, ja;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ja = hb();
            Aa[0] = (Aa[0] & -256) | ja;
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 0)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Xf & Uf) Lb = Nb;;
        } else {
            ja = hb();
            Aa[0] = (Aa[0] & -256) | ja;
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 0)) & Uf);
        }
    }

    function fg() {
        var Uf, Vf, Xf, ja;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Vf = Aa[7];
        ia = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ja = hb();
            gc(7, Aa[0], ja);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 0)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Ga & 0x0010) {
                if (!(Ca == 0)) return;
            } else {
                if ((Ca == 0)) return;
            } if (Xf & Uf) Lb = Nb;;
        } else {
            ja = hb();
            gc(7, Aa[0], ja);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 0)) & Uf);
        }
    }

    function gg() {
        var Uf, Vf, Wf, Xf, Va, ja;
        Va = (za.eflags >> 12) & 3;
        if (za.cpl > Va) Dc(13);
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Vf = Aa[7];
        Wf = Aa[2] & 0xffff;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;; {
                ja = za.ld16_port(Wf);
                ia = ((Vf & Uf) + za.segs[0].base) >> 0;
                vb(ja);
                Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 1)) & Uf);
                Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
                if (Xf & Uf) Lb = Nb;;
            }
        } else {
            ja = za.ld16_port(Wf);
            ia = ((Vf & Uf) + za.segs[0].base) >> 0;
            vb(ja);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 1)) & Uf);
        }
    }

    function hg() {
        var Uf, Zf, Tb, Xf, Wf, Va, ja;
        Va = (za.eflags >> 12) & 3;
        if (za.cpl > Va) Dc(13);
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        Wf = Aa[2] & 0xffff;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
            ja = jb();
            za.st16_port(Wf, ja);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 1)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Xf & Uf) Lb = Nb;;
        } else {
            ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
            ja = jb();
            za.st16_port(Wf, ja);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 1)) & Uf);
        }
    }

    function ig() {
        var Uf, Vf, Zf, Xf, Tb, bg;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        Vf = Aa[7];
        ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
        bg = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;; {
                ja = jb();
                ia = bg;
                vb(ja);
                Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 1)) & Uf);
                Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 1)) & Uf);
                Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
                if (Xf & Uf) Lb = Nb;;
            }
        } else {
            ja = jb();
            ia = bg;
            vb(ja);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 1)) & Uf);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 1)) & Uf);
        }
    }

    function jg() {
        var Uf, Vf, Xf;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Vf = Aa[7];
        ia = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;; {
                vb(Aa[0]);
                Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 1)) & Uf);
                Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
                if (Xf & Uf) Lb = Nb;;
            }
        } else {
            vb(Aa[0]);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 1)) & Uf);
        }
    }

    function kg() {
        var Uf, Vf, Zf, Xf, Tb, bg;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        Vf = Aa[7];
        ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
        bg = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ja = jb();
            ia = bg;
            Ka = jb();
            dc(7, ja, Ka);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 1)) & Uf);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 1)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Ga & 0x0010) {
                if (!(Ca == 0)) return;
            } else {
                if ((Ca == 0)) return;
            } if (Xf & Uf) Lb = Nb;;
        } else {
            ja = jb();
            ia = bg;
            Ka = jb();
            dc(7, ja, Ka);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 1)) & Uf);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 1)) & Uf);
        }
    }

    function lg() {
        var Uf, Zf, Tb, Xf, ja;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ja = jb();
            Aa[0] = (Aa[0] & -65536) | ja;
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 1)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Xf & Uf) Lb = Nb;;
        } else {
            ja = jb();
            Aa[0] = (Aa[0] & -65536) | ja;
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 1)) & Uf);
        }
    }

    function mg() {
        var Uf, Vf, Xf, ja;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Vf = Aa[7];
        ia = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ja = jb();
            dc(7, Aa[0], ja);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 1)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Ga & 0x0010) {
                if (!(Ca == 0)) return;
            } else {
                if ((Ca == 0)) return;
            } if (Xf & Uf) Lb = Nb;;
        } else {
            ja = jb();
            dc(7, Aa[0], ja);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 1)) & Uf);
        }
    }

    function ng() {
        var Uf, Vf, Wf, Xf, Va, ja;
        Va = (za.eflags >> 12) & 3;
        if (za.cpl > Va) Dc(13);
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Vf = Aa[7];
        Wf = Aa[2] & 0xffff;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            if (Uf == -1 && za.df == 1 && (ia & 3) == 0) {
                var og, l, pg, i, qg, ja, rg;
                og = Xf >>> 0;
                l = (4096 - (ia & 0xfff)) >> 2;
                if (og > l) og = l;
                pg = td(Aa[7], 1);
                rg = za.ld32_port;
                for (i = 0; i < og; i++) {
                    ja = rg(Wf);
                    Wa[pg] = ja & 0xff;
                    Wa[pg + 1] = (ja >> 8) & 0xff;
                    Wa[pg + 2] = (ja >> 16) & 0xff;
                    Wa[pg + 3] = (ja >> 24) & 0xff;
                    pg += 4;
                }
                qg = og << 2;
                Aa[7] = (Vf + qg) >> 0;
                Aa[1] = Xf = (Xf - og) >> 0;
                if (Xf) Lb = Nb;
            } else {
                ja = za.ld32_port(Wf);
                ia = ((Vf & Uf) + za.segs[0].base) >> 0;
                xb(ja);
                Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 2)) & Uf);
                Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
                if (Xf & Uf) Lb = Nb;;
            }
        } else {
            ja = za.ld32_port(Wf);
            ia = ((Vf & Uf) + za.segs[0].base) >> 0;
            xb(ja);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 2)) & Uf);
        }
    }

    function sg() {
        var Uf, Zf, Tb, Xf, Wf, Va, ja;
        Va = (za.eflags >> 12) & 3;
        if (za.cpl > Va) Dc(13);
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        Wf = Aa[2] & 0xffff;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
            ja = lb();
            za.st32_port(Wf, ja);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 2)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Xf & Uf) Lb = Nb;;
        } else {
            ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
            ja = lb();
            za.st32_port(Wf, ja);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 2)) & Uf);
        }
    }

    function tg() {
        var Uf, Vf, Zf, Xf, Tb, bg;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        Vf = Aa[7];
        ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
        bg = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            if (Uf == -1 && za.df == 1 && ((ia | bg) & 3) == 0) {
                var og, l, ug, pg, i, qg;
                og = Xf >>> 0;
                l = (4096 - (ia & 0xfff)) >> 2;
                if (og > l) og = l;
                l = (4096 - (bg & 0xfff)) >> 2;
                if (og > l) og = l;
                ug = td(ia, 0);
                pg = td(bg, 1);
                qg = og << 2;
                for (i = 0; i < qg; i++) Wa[pg + i] = Wa[ug + i];
                Aa[6] = (Zf + qg) >> 0;
                Aa[7] = (Vf + qg) >> 0;
                Aa[1] = Xf = (Xf - og) >> 0;
                if (Xf) Lb = Nb;
            } else {
                ja = lb();
                ia = bg;
                xb(ja);
                Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 2)) & Uf);
                Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 2)) & Uf);
                Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
                if (Xf & Uf) Lb = Nb;;
            }
        } else {
            ja = lb();
            ia = bg;
            xb(ja);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 2)) & Uf);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 2)) & Uf);
        }
    }

    function vg() {
        var Uf, Vf, Xf;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Vf = Aa[7];
        ia = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            if (Uf == -1 && za.df == 1 && (ia & 3) == 0) {
                var og, l, pg, i, qg, ja;
                og = Xf >>> 0;
                l = (4096 - (ia & 0xfff)) >> 2;
                if (og > l) og = l;
                pg = td(Aa[7], 1);
                ja = Aa[0];
                for (i = 0; i < og; i++) {
                    Wa[pg] = ja & 0xff;
                    Wa[pg + 1] = (ja >> 8) & 0xff;
                    Wa[pg + 2] = (ja >> 16) & 0xff;
                    Wa[pg + 3] = (ja >> 24) & 0xff;
                    pg += 4;
                }
                qg = og << 2;
                Aa[7] = (Vf + qg) >> 0;
                Aa[1] = Xf = (Xf - og) >> 0;
                if (Xf) Lb = Nb;
            } else {
                xb(Aa[0]);
                Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 2)) & Uf);
                Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
                if (Xf & Uf) Lb = Nb;;
            }
        } else {
            xb(Aa[0]);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 2)) & Uf);
        }
    }

    function wg() {
        var Uf, Vf, Zf, Xf, Tb, bg;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        Vf = Aa[7];
        ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
        bg = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ja = lb();
            ia = bg;
            Ka = lb();
            Yb(7, ja, Ka);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 2)) & Uf);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 2)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Ga & 0x0010) {
                if (!(Ca == 0)) return;
            } else {
                if ((Ca == 0)) return;
            } if (Xf & Uf) Lb = Nb;;
        } else {
            ja = lb();
            ia = bg;
            Ka = lb();
            Yb(7, ja, Ka);
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 2)) & Uf);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 2)) & Uf);
        }
    }

    function xg() {
        var Uf, Zf, Tb, Xf, ja;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Tb = Ga & 0x000f;
        if (Tb == 0) Tb = 3;
        else Tb--;
        Zf = Aa[6];
        ia = ((Zf & Uf) + za.segs[Tb].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ja = lb();
            Aa[0] = ja;
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 2)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Xf & Uf) Lb = Nb;;
        } else {
            ja = lb();
            Aa[0] = ja;
            Aa[6] = (Zf & ~Uf) | ((Zf + (za.df << 2)) & Uf);
        }
    }

    function yg() {
        var Uf, Vf, Xf, ja;
        if (Ga & 0x0080) Uf = 0xffff;
        else Uf = -1;
        Vf = Aa[7];
        ia = ((Vf & Uf) + za.segs[0].base) >> 0;
        if (Ga & (0x0010 | 0x0020)) {
            Xf = Aa[1];
            if ((Xf & Uf) == 0) return;;
            ja = lb();
            Yb(7, Aa[0], ja);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 2)) & Uf);
            Aa[1] = Xf = (Xf & ~Uf) | ((Xf - 1) & Uf);
            if (Ga & 0x0010) {
                if (!(Ca == 0)) return;
            } else {
                if ((Ca == 0)) return;
            } if (Xf & Uf) Lb = Nb;;
        } else {
            ja = lb();
            Yb(7, Aa[0], ja);
            Aa[7] = (Vf & ~Uf) | ((Vf + (za.df << 2)) & Uf);
        }
    }
    za = this;
    Wa = this.phys_mem8;
    ab = this.tlb_read_user;
    bb = this.tlb_write_user;
    Ya = this.tlb_read_kernel;
    Za = this.tlb_write_kernel;
    if (za.cpl == 3) {
        cb = ab;
        db = bb;
    } else {
        cb = Ya;
        db = Za;
    } if (za.halted) {
        if (za.hard_irq != 0 && (za.eflags & 0x00000200)) {
            za.halted = 0;
        } else {
            return 257;
        }
    }
    Aa = this.regs;
    Ba = this.cc_src;
    Ca = this.cc_dst;
    Da = this.cc_op;
    Ea = this.cc_op2;
    Fa = this.cc_dst2;
    Kb = this.eip;
    ce();
    Oa = 256;
    Na = xa;
    if (ya) {;
        Ae(ya.intno, 0, ya.error_code, 0, 0);
    }
    if (za.hard_intno >= 0) {;
        Ae(za.hard_intno, 0, 0, 0, 1);
        za.hard_intno = -1;
    }
    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) {
        za.hard_intno = za.get_hard_intno();;
        Ae(za.hard_intno, 0, 0, 0, 1);
        za.hard_intno = -1;
    }
    Lb = 0;
    Nb = 0;
    zg: do {;
        Kb = (Kb + Lb - Nb) >> 0;
        Ob = (Kb + Qa) >> 0;
        Mb = cb[Ob >>> 12];
        if (((Mb | Ob) & 0xfff) >= (4096 - 15 + 1)) {
            var Ag;
            if (Mb == -1) gb(Ob, 0, za.cpl == 3);
            Mb = cb[Ob >>> 12];
            Nb = Lb = Ob ^ Mb;
            b = Wa[Lb++];;
            Ag = Ob & 0xfff;
            if (Ag >= (4096 - 15 + 1)) {
                ja = Cd(Ob, b);
                if ((Ag + ja) > 4096) {
                    Nb = Lb = this.mem_size;
                    for (Ka = 0; Ka < ja; Ka++) {
                        ia = (Ob + Ka) >> 0;
                        Wa[Lb + Ka] = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                    }
                    Lb++;
                }
            }
        } else {
            Nb = Lb = Ob ^ Mb;
            b = Wa[Lb++];;
        }
        b |= (Ga = Ua) & 0x0100;
        Fd: for (;;) {
            switch (b) {
            case 0x66:
                if (Ga == Ua) Cd(Ob, b);
                if (Ua & 0x0100) Ga &= ~0x0100;
                else Ga |= 0x0100;
                b = Wa[Lb++];;
                b |= (Ga & 0x0100);
                break;
            case 0x67:
                if (Ga == Ua) Cd(Ob, b);
                if (Ua & 0x0080) Ga &= ~0x0080;
                else Ga |= 0x0080;
                b = Wa[Lb++];;
                b |= (Ga & 0x0100);
                break;
            case 0xf0:
                if (Ga == Ua) Cd(Ob, b);
                Ga |= 0x0040;
                b = Wa[Lb++];;
                b |= (Ga & 0x0100);
                break;
            case 0xf2:
                if (Ga == Ua) Cd(Ob, b);
                Ga |= 0x0020;
                b = Wa[Lb++];;
                b |= (Ga & 0x0100);
                break;
            case 0xf3:
                if (Ga == Ua) Cd(Ob, b);
                Ga |= 0x0010;
                b = Wa[Lb++];;
                b |= (Ga & 0x0100);
                break;
            case 0x26:
            case 0x2e:
            case 0x36:
            case 0x3e:
                if (Ga == Ua) Cd(Ob, b);
                Ga = (Ga & ~0x000f) | (((b >> 3) & 3) + 1);
                b = Wa[Lb++];;
                b |= (Ga & 0x0100);;
                break;
            case 0x64:
            case 0x65:
                if (Ga == Ua) Cd(Ob, b);
                Ga = (Ga & ~0x000f) | ((b & 7) + 1);
                b = Wa[Lb++];;
                b |= (Ga & 0x0100);;
                break;
            case 0xb0:
            case 0xb1:
            case 0xb2:
            case 0xb3:
            case 0xb4:
            case 0xb5:
            case 0xb6:
            case 0xb7:
                ja = Wa[Lb++];;
                b &= 7;
                Xa = (b & 4) << 1;
                Aa[b & 3] = (Aa[b & 3] & ~(0xff << Xa)) | (((ja) & 0xff) << Xa);
                break Fd;
            case 0xb8:
            case 0xb9:
            case 0xba:
            case 0xbb:
            case 0xbc:
            case 0xbd:
            case 0xbe:
            case 0xbf:
                {
                    ja = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                Aa[b & 7] = ja;
                break Fd;
            case 0x88:
                Ha = Wa[Lb++];;
                Ja = (Ha >> 3) & 7;
                ja = (Aa[Ja & 3] >> ((Ja & 4) << 1));
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    Xa = (Ia & 4) << 1;
                    Aa[Ia & 3] = (Aa[Ia & 3] & ~(0xff << Xa)) | (((ja) & 0xff) << Xa);
                } else {
                    ia = Qb(Ha); {
                        Xa = db[ia >>> 12];
                        if (Xa == -1) {
                            sb(ja);
                        } else {
                            Wa[ia ^ Xa] = ja & 0xff;
                        }
                    };
                }
                break Fd;
            case 0x89:
                Ha = Wa[Lb++];;
                ja = Aa[(Ha >> 3) & 7];
                if ((Ha >> 6) == 3) {
                    Aa[Ha & 7] = ja;
                } else {
                    ia = Qb(Ha); {
                        Xa = db[ia >>> 12];
                        if ((Xa | ia) & 3) {
                            wb(ja);
                        } else {
                            Xa ^= ia;
                            Wa[Xa] = ja & 0xff;
                            Wa[Xa + 1] = (ja >> 8) & 0xff;
                            Wa[Xa + 2] = (ja >> 16) & 0xff;
                            Wa[Xa + 3] = (ja >> 24) & 0xff;
                        }
                    };
                }
                break Fd;
            case 0x8a:
                Ha = Wa[Lb++];;
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                } else {
                    ia = Qb(Ha);
                    ja = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                }
                Ja = (Ha >> 3) & 7;
                Xa = (Ja & 4) << 1;
                Aa[Ja & 3] = (Aa[Ja & 3] & ~(0xff << Xa)) | (((ja) & 0xff) << Xa);
                break Fd;
            case 0x8b:
                Ha = Wa[Lb++];;
                if ((Ha >> 6) == 3) {
                    ja = Aa[Ha & 7];
                } else {
                    ia = Qb(Ha);
                    ja = (((Xa = cb[ia >>> 12]) | ia) & 3 ? kb() : (Xa ^= ia, Wa[Xa] | (Wa[Xa + 1] << 8) | (Wa[Xa + 2] << 16) | (Wa[Xa + 3] << 24)));
                }
                Aa[(Ha >> 3) & 7] = ja;
                break Fd;
            case 0xa0:
                ia = Vb();
                ja = hb();
                Aa[0] = (Aa[0] & -256) | ja;
                break Fd;
            case 0xa1:
                ia = Vb();
                ja = lb();
                Aa[0] = ja;
                break Fd;
            case 0xa2:
                ia = Vb();
                tb(Aa[0]);
                break Fd;
            case 0xa3:
                ia = Vb();
                xb(Aa[0]);
                break Fd;
            case 0xd7:
                ia = (Aa[3] + (Aa[0] & 0xff)) >> 0;
                if (Ga & 0x0080) ia &= 0xffff;
                Ja = Ga & 0x000f;
                if (Ja == 0) Ja = 3;
                else Ja--;
                ia = (ia + za.segs[Ja].base) >> 0;
                ja = hb();
                Wb(0, ja);
                break Fd;
            case 0xc6:
                Ha = Wa[Lb++];;
                if ((Ha >> 6) == 3) {
                    ja = Wa[Lb++];;
                    Wb(Ha & 7, ja);
                } else {
                    ia = Qb(Ha);
                    ja = Wa[Lb++];;
                    tb(ja);
                }
                break Fd;
            case 0xc7:
                Ha = Wa[Lb++];;
                if ((Ha >> 6) == 3) {
                    {
                        ja = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                        Lb += 4;
                    };
                    Aa[Ha & 7] = ja;
                } else {
                    ia = Qb(Ha); {
                        ja = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                        Lb += 4;
                    };
                    xb(ja);
                }
                break Fd;
            case 0x91:
            case 0x92:
            case 0x93:
            case 0x94:
            case 0x95:
            case 0x96:
            case 0x97:
                Ja = b & 7;
                ja = Aa[0];
                Aa[0] = Aa[Ja];
                Aa[Ja] = ja;
                break Fd;
            case 0x86:
                Ha = Wa[Lb++];;
                Ja = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                    Wb(Ia, (Aa[Ja & 3] >> ((Ja & 4) << 1)));
                } else {
                    ia = Qb(Ha);
                    ja = nb();
                    tb((Aa[Ja & 3] >> ((Ja & 4) << 1)));
                }
                Wb(Ja, ja);
                break Fd;
            case 0x87:
                Ha = Wa[Lb++];;
                Ja = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    ja = Aa[Ia];
                    Aa[Ia] = Aa[Ja];
                } else {
                    ia = Qb(Ha);
                    ja = rb();
                    xb(Aa[Ja]);
                }
                Aa[Ja] = ja;
                break Fd;
            case 0x8e:
                Ha = Wa[Lb++];;
                Ja = (Ha >> 3) & 7;
                if (Ja >= 6 || Ja == 1) Dc(6);
                if ((Ha >> 6) == 3) {
                    ja = Aa[Ha & 7] & 0xffff;
                } else {
                    ia = Qb(Ha);
                    ja = jb();
                }
                He(Ja, ja);
                break Fd;
            case 0x8c:
                Ha = Wa[Lb++];;
                Ja = (Ha >> 3) & 7;
                if (Ja >= 6) Dc(6);
                ja = za.segs[Ja].selector;
                if ((Ha >> 6) == 3) {
                    if ((((Ga >> 8) & 1) ^ 1)) {
                        Aa[Ha & 7] = ja;
                    } else {
                        Xb(Ha & 7, ja);
                    }
                } else {
                    ia = Qb(Ha);
                    vb(ja);
                }
                break Fd;
            case 0xc4:
                Rf(0);
                break Fd;
            case 0xc5:
                Rf(3);
                break Fd;
            case 0x00:
            case 0x08:
            case 0x10:
            case 0x18:
            case 0x20:
            case 0x28:
            case 0x30:
            case 0x38:
                Ha = Wa[Lb++];;
                Ma = b >> 3;
                Ja = (Ha >> 3) & 7;
                Ka = (Aa[Ja & 3] >> ((Ja & 4) << 1));
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    Wb(Ia, gc(Ma, (Aa[Ia & 3] >> ((Ia & 4) << 1)), Ka));
                } else {
                    ia = Qb(Ha);
                    if (Ma != 7) {
                        ja = nb();
                        ja = gc(Ma, ja, Ka);
                        tb(ja);
                    } else {
                        ja = hb();
                        gc(7, ja, Ka);
                    }
                }
                break Fd;
            case 0x01:
                Ha = Wa[Lb++];;
                Ka = Aa[(Ha >> 3) & 7];
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7; {
                        Ba = Ka;
                        Ca = Aa[Ia] = (Aa[Ia] + Ba) >> 0;
                        Da = 2;
                    };
                } else {
                    ia = Qb(Ha);
                    ja = rb(); {
                        Ba = Ka;
                        Ca = ja = (ja + Ba) >> 0;
                        Da = 2;
                    };
                    xb(ja);
                }
                break Fd;
            case 0x09:
            case 0x11:
            case 0x19:
            case 0x21:
            case 0x29:
            case 0x31:
                Ha = Wa[Lb++];;
                Ma = b >> 3;
                Ka = Aa[(Ha >> 3) & 7];
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    Aa[Ia] = Yb(Ma, Aa[Ia], Ka);
                } else {
                    ia = Qb(Ha);
                    ja = rb();
                    ja = Yb(Ma, ja, Ka);
                    xb(ja);
                }
                break Fd;
            case 0x39:
                Ha = Wa[Lb++];;
                Ma = b >> 3;
                Ka = Aa[(Ha >> 3) & 7];
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7; {
                        Ba = Ka;
                        Ca = (Aa[Ia] - Ba) >> 0;
                        Da = 8;
                    };
                } else {
                    ia = Qb(Ha);
                    ja = lb(); {
                        Ba = Ka;
                        Ca = (ja - Ba) >> 0;
                        Da = 8;
                    };
                }
                break Fd;
            case 0x02:
            case 0x0a:
            case 0x12:
            case 0x1a:
            case 0x22:
            case 0x2a:
            case 0x32:
            case 0x3a:
                Ha = Wa[Lb++];;
                Ma = b >> 3;
                Ja = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    Ka = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                } else {
                    ia = Qb(Ha);
                    Ka = hb();
                }
                Wb(Ja, gc(Ma, (Aa[Ja & 3] >> ((Ja & 4) << 1)), Ka));
                break Fd;
            case 0x03:
                Ha = Wa[Lb++];;
                Ja = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ka = Aa[Ha & 7];
                } else {
                    ia = Qb(Ha);
                    Ka = lb();
                } {
                    Ba = Ka;
                    Ca = Aa[Ja] = (Aa[Ja] + Ba) >> 0;
                    Da = 2;
                };
                break Fd;
            case 0x0b:
            case 0x13:
            case 0x1b:
            case 0x23:
            case 0x2b:
            case 0x33:
                Ha = Wa[Lb++];;
                Ma = b >> 3;
                Ja = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ka = Aa[Ha & 7];
                } else {
                    ia = Qb(Ha);
                    Ka = lb();
                }
                Aa[Ja] = Yb(Ma, Aa[Ja], Ka);
                break Fd;
            case 0x3b:
                Ha = Wa[Lb++];;
                Ma = b >> 3;
                Ja = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ka = Aa[Ha & 7];
                } else {
                    ia = Qb(Ha);
                    Ka = lb();
                } {
                    Ba = Ka;
                    Ca = (Aa[Ja] - Ba) >> 0;
                    Da = 8;
                };
                break Fd;
            case 0x04:
            case 0x0c:
            case 0x14:
            case 0x1c:
            case 0x24:
            case 0x2c:
            case 0x34:
            case 0x3c:
                Ka = Wa[Lb++];;
                Ma = b >> 3;
                Wb(0, gc(Ma, Aa[0] & 0xff, Ka));
                break Fd;
            case 0x05:
                {
                    Ka = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                }; {
                    Ba = Ka;
                    Ca = Aa[0] = (Aa[0] + Ba) >> 0;
                    Da = 2;
                };
                break Fd;
            case 0x0d:
            case 0x15:
            case 0x1d:
            case 0x25:
            case 0x2d:
                {
                    Ka = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                Ma = b >> 3;
                Aa[0] = Yb(Ma, Aa[0], Ka);
                break Fd;
            case 0x35:
                {
                    Ka = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                }; {
                    Ca = Aa[0] = Aa[0] ^ Ka;
                    Da = 14;
                };
                break Fd;
            case 0x3d:
                {
                    Ka = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                }; {
                    Ba = Ka;
                    Ca = (Aa[0] - Ba) >> 0;
                    Da = 8;
                };
                break Fd;
            case 0x80:
            case 0x82:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    Ka = Wa[Lb++];;
                    Wb(Ia, gc(Ma, (Aa[Ia & 3] >> ((Ia & 4) << 1)), Ka));
                } else {
                    ia = Qb(Ha);
                    Ka = Wa[Lb++];;
                    if (Ma != 7) {
                        ja = nb();
                        ja = gc(Ma, ja, Ka);
                        tb(ja);
                    } else {
                        ja = hb();
                        gc(7, ja, Ka);
                    }
                }
                break Fd;
            case 0x81:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                if (Ma == 7) {
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = lb();
                    } {
                        Ka = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                        Lb += 4;
                    }; {
                        Ba = Ka;
                        Ca = (ja - Ba) >> 0;
                        Da = 8;
                    };
                } else {
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7; {
                            Ka = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                            Lb += 4;
                        };
                        Aa[Ia] = Yb(Ma, Aa[Ia], Ka);
                    } else {
                        ia = Qb(Ha); {
                            Ka = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                            Lb += 4;
                        };
                        ja = rb();
                        ja = Yb(Ma, ja, Ka);
                        xb(ja);
                    }
                }
                break Fd;
            case 0x83:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                if (Ma == 7) {
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = lb();
                    }
                    Ka = ((Wa[Lb++] << 24) >> 24);; {
                        Ba = Ka;
                        Ca = (ja - Ba) >> 0;
                        Da = 8;
                    };
                } else {
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Ka = ((Wa[Lb++] << 24) >> 24);;
                        Aa[Ia] = Yb(Ma, Aa[Ia], Ka);
                    } else {
                        ia = Qb(Ha);
                        Ka = ((Wa[Lb++] << 24) >> 24);;
                        ja = rb();
                        ja = Yb(Ma, ja, Ka);
                        xb(ja);
                    }
                }
                break Fd;
            case 0x40:
            case 0x41:
            case 0x42:
            case 0x43:
            case 0x44:
            case 0x45:
            case 0x46:
            case 0x47:
                Ja = b & 7; {
                    if (Da < 25) {
                        Ea = Da;
                        Fa = Ca;
                    }
                    Aa[Ja] = Ca = (Aa[Ja] + 1) >> 0;
                    Da = 27;
                };
                break Fd;
            case 0x48:
            case 0x49:
            case 0x4a:
            case 0x4b:
            case 0x4c:
            case 0x4d:
            case 0x4e:
            case 0x4f:
                Ja = b & 7; {
                    if (Da < 25) {
                        Ea = Da;
                        Fa = Ca;
                    }
                    Aa[Ja] = Ca = (Aa[Ja] - 1) >> 0;
                    Da = 30;
                };
                break Fd;
            case 0x6b:
                Ha = Wa[Lb++];;
                Ja = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ka = Aa[Ha & 7];
                } else {
                    ia = Qb(Ha);
                    Ka = lb();
                }
                La = ((Wa[Lb++] << 24) >> 24);;
                Aa[Ja] = Wc(Ka, La);
                break Fd;
            case 0x69:
                Ha = Wa[Lb++];;
                Ja = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ka = Aa[Ha & 7];
                } else {
                    ia = Qb(Ha);
                    Ka = lb();
                } {
                    La = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                Aa[Ja] = Wc(Ka, La);
                break Fd;
            case 0x84:
                Ha = Wa[Lb++];;
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                } else {
                    ia = Qb(Ha);
                    ja = hb();
                }
                Ja = (Ha >> 3) & 7;
                Ka = (Aa[Ja & 3] >> ((Ja & 4) << 1)); {
                    Ca = (((ja & Ka) << 24) >> 24);
                    Da = 12;
                };
                break Fd;
            case 0x85:
                Ha = Wa[Lb++];;
                if ((Ha >> 6) == 3) {
                    ja = Aa[Ha & 7];
                } else {
                    ia = Qb(Ha);
                    ja = lb();
                }
                Ka = Aa[(Ha >> 3) & 7]; {
                    Ca = ja & Ka;
                    Da = 14;
                };
                break Fd;
            case 0xa8:
                Ka = Wa[Lb++];; {
                    Ca = (((Aa[0] & Ka) << 24) >> 24);
                    Da = 12;
                };
                break Fd;
            case 0xa9:
                {
                    Ka = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                }; {
                    Ca = Aa[0] & Ka;
                    Da = 14;
                };
                break Fd;
            case 0xf6:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                switch (Ma) {
                case 0:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                    } else {
                        ia = Qb(Ha);
                        ja = hb();
                    }
                    Ka = Wa[Lb++];; {
                        Ca = (((ja & Ka) << 24) >> 24);
                        Da = 12;
                    };
                    break;
                case 2:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Wb(Ia, ~ (Aa[Ia & 3] >> ((Ia & 4) << 1)));
                    } else {
                        ia = Qb(Ha);
                        ja = nb();
                        ja = ~ja;
                        tb(ja);
                    }
                    break;
                case 3:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Wb(Ia, gc(5, 0, (Aa[Ia & 3] >> ((Ia & 4) << 1))));
                    } else {
                        ia = Qb(Ha);
                        ja = nb();
                        ja = gc(5, 0, ja);
                        tb(ja);
                    }
                    break;
                case 4:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                    } else {
                        ia = Qb(Ha);
                        ja = hb();
                    }
                    Xb(0, Oc(Aa[0], ja));
                    break;
                case 5:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                    } else {
                        ia = Qb(Ha);
                        ja = hb();
                    }
                    Xb(0, Pc(Aa[0], ja));
                    break;
                case 6:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                    } else {
                        ia = Qb(Ha);
                        ja = hb();
                    }
                    Cc(ja);
                    break;
                case 7:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                    } else {
                        ia = Qb(Ha);
                        ja = hb();
                    }
                    Ec(ja);
                    break;
                default:
                    Dc(6);
                }
                break Fd;
            case 0xf7:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                switch (Ma) {
                case 0:
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = lb();
                    } {
                        Ka = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                        Lb += 4;
                    }; {
                        Ca = ja & Ka;
                        Da = 14;
                    };
                    break;
                case 2:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Aa[Ia] = ~Aa[Ia];
                    } else {
                        ia = Qb(Ha);
                        ja = rb();
                        ja = ~ja;
                        xb(ja);
                    }
                    break;
                case 3:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Aa[Ia] = Yb(5, 0, Aa[Ia]);
                    } else {
                        ia = Qb(Ha);
                        ja = rb();
                        ja = Yb(5, 0, ja);
                        xb(ja);
                    }
                    break;
                case 4:
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = lb();
                    }
                    Aa[0] = Vc(Aa[0], ja);
                    Aa[2] = Pa;
                    break;
                case 5:
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = lb();
                    }
                    Aa[0] = Wc(Aa[0], ja);
                    Aa[2] = Pa;
                    break;
                case 6:
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = lb();
                    }
                    Aa[0] = Hc(Aa[2], Aa[0], ja);
                    Aa[2] = Pa;
                    break;
                case 7:
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = lb();
                    }
                    Aa[0] = Lc(Aa[2], Aa[0], ja);
                    Aa[2] = Pa;
                    break;
                default:
                    Dc(6);
                }
                break Fd;
            case 0xc0:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ka = Wa[Lb++];;
                    Ia = Ha & 7;
                    Wb(Ia, jc(Ma, (Aa[Ia & 3] >> ((Ia & 4) << 1)), Ka));
                } else {
                    ia = Qb(Ha);
                    Ka = Wa[Lb++];;
                    ja = nb();
                    ja = jc(Ma, ja, Ka);
                    tb(ja);
                }
                break Fd;
            case 0xc1:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ka = Wa[Lb++];;
                    Ia = Ha & 7;
                    Aa[Ia] = nc(Ma, Aa[Ia], Ka);
                } else {
                    ia = Qb(Ha);
                    Ka = Wa[Lb++];;
                    ja = rb();
                    ja = nc(Ma, ja, Ka);
                    xb(ja);
                }
                break Fd;
            case 0xd0:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    Wb(Ia, jc(Ma, (Aa[Ia & 3] >> ((Ia & 4) << 1)), 1));
                } else {
                    ia = Qb(Ha);
                    ja = nb();
                    ja = jc(Ma, ja, 1);
                    tb(ja);
                }
                break Fd;
            case 0xd1:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    Aa[Ia] = nc(Ma, Aa[Ia], 1);
                } else {
                    ia = Qb(Ha);
                    ja = rb();
                    ja = nc(Ma, ja, 1);
                    xb(ja);
                }
                break Fd;
            case 0xd2:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                Ka = Aa[1] & 0xff;
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    Wb(Ia, jc(Ma, (Aa[Ia & 3] >> ((Ia & 4) << 1)), Ka));
                } else {
                    ia = Qb(Ha);
                    ja = nb();
                    ja = jc(Ma, ja, Ka);
                    tb(ja);
                }
                break Fd;
            case 0xd3:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                Ka = Aa[1] & 0xff;
                if ((Ha >> 6) == 3) {
                    Ia = Ha & 7;
                    Aa[Ia] = nc(Ma, Aa[Ia], Ka);
                } else {
                    ia = Qb(Ha);
                    ja = rb();
                    ja = nc(Ma, ja, Ka);
                    xb(ja);
                }
                break Fd;
            case 0x98:
                Aa[0] = (Aa[0] << 16) >> 16;
                break Fd;
            case 0x99:
                Aa[2] = Aa[0] >> 31;
                break Fd;
            case 0x50:
            case 0x51:
            case 0x52:
            case 0x53:
            case 0x54:
            case 0x55:
            case 0x56:
            case 0x57:
                ja = Aa[b & 7];
                if (Ta) {
                    ia = (Aa[4] - 4) >> 0; {
                        Xa = db[ia >>> 12];
                        if ((Xa | ia) & 3) {
                            wb(ja);
                        } else {
                            Xa ^= ia;
                            Wa[Xa] = ja & 0xff;
                            Wa[Xa + 1] = (ja >> 8) & 0xff;
                            Wa[Xa + 2] = (ja >> 16) & 0xff;
                            Wa[Xa + 3] = (ja >> 24) & 0xff;
                        }
                    };
                    Aa[4] = ia;
                } else {
                    xd(ja);
                }
                break Fd;
            case 0x58:
            case 0x59:
            case 0x5a:
            case 0x5b:
            case 0x5c:
            case 0x5d:
            case 0x5e:
            case 0x5f:
                if (Ta) {
                    ia = Aa[4];
                    ja = (((Xa = cb[ia >>> 12]) | ia) & 3 ? kb() : (Xa ^= ia, Wa[Xa] | (Wa[Xa + 1] << 8) | (Wa[Xa + 2] << 16) | (Wa[Xa + 3] << 24)));
                    Aa[4] = (ia + 4) >> 0;
                } else {
                    ja = Ad();
                    Bd();
                }
                Aa[b & 7] = ja;
                break Fd;
            case 0x60:
                Hf();
                break Fd;
            case 0x61:
                Jf();
                break Fd;
            case 0x8f:
                Ha = Wa[Lb++];;
                if ((Ha >> 6) == 3) {
                    ja = Ad();
                    Bd();
                    Aa[Ha & 7] = ja;
                } else {
                    ja = Ad();
                    Ka = Aa[4];
                    Bd();
                    La = Aa[4];
                    ia = Qb(Ha);
                    Aa[4] = Ka;
                    xb(ja);
                    Aa[4] = La;
                }
                break Fd;
            case 0x68:
                {
                    ja = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                if (Ta) {
                    ia = (Aa[4] - 4) >> 0;
                    xb(ja);
                    Aa[4] = ia;
                } else {
                    xd(ja);
                }
                break Fd;
            case 0x6a:
                ja = ((Wa[Lb++] << 24) >> 24);;
                if (Ta) {
                    ia = (Aa[4] - 4) >> 0;
                    xb(ja);
                    Aa[4] = ia;
                } else {
                    xd(ja);
                }
                break Fd;
            case 0xc8:
                Qf();
                break Fd;
            case 0xc9:
                if (Ta) {
                    ia = Aa[5];
                    ja = lb();
                    Aa[5] = ja;
                    Aa[4] = (ia + 4) >> 0;
                } else {
                    Lf();
                }
                break Fd;
            case 0x9c:
                Va = (za.eflags >> 12) & 3;
                if ((za.eflags & 0x00020000) && Va != 3) Dc(13);
                ja = id() & ~(0x00020000 | 0x00010000);
                if ((((Ga >> 8) & 1) ^ 1)) {
                    xd(ja);
                } else {
                    vd(ja);
                }
                break Fd;
            case 0x9d:
                Va = (za.eflags >> 12) & 3;
                if ((za.eflags & 0x00020000) && Va != 3) Dc(13);
                if ((((Ga >> 8) & 1) ^ 1)) {
                    ja = Ad();
                    Bd();
                    Ka = -1;
                } else {
                    ja = yd();
                    zd();
                    Ka = 0xffff;
                }
                La = (0x00000100 | 0x00040000 | 0x00200000 | 0x00004000);
                if (za.cpl == 0) {
                    La |= 0x00000200 | 0x00003000;
                } else {
                    if (za.cpl <= Va) La |= 0x00000200;
                }
                kd(ja, La & Ka); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0x06:
            case 0x0e:
            case 0x16:
            case 0x1e:
                xd(za.segs[b >> 3].selector);
                break Fd;
            case 0x07:
            case 0x17:
            case 0x1f:
                He(b >> 3, Ad() & 0xffff);
                Bd();
                break Fd;
            case 0x8d:
                Ha = Wa[Lb++];;
                if ((Ha >> 6) == 3) Dc(6);
                Ga = (Ga & ~0x000f) | (6 + 1);
                Aa[(Ha >> 3) & 7] = Qb(Ha);
                break Fd;
            case 0xfe:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                switch (Ma) {
                case 0:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Wb(Ia, hc((Aa[Ia & 3] >> ((Ia & 4) << 1))));
                    } else {
                        ia = Qb(Ha);
                        ja = nb();
                        ja = hc(ja);
                        tb(ja);
                    }
                    break;
                case 1:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Wb(Ia, ic((Aa[Ia & 3] >> ((Ia & 4) << 1))));
                    } else {
                        ia = Qb(Ha);
                        ja = nb();
                        ja = ic(ja);
                        tb(ja);
                    }
                    break;
                default:
                    Dc(6);
                }
                break Fd;
            case 0xff:
                Ha = Wa[Lb++];;
                Ma = (Ha >> 3) & 7;
                switch (Ma) {
                case 0:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7; {
                            if (Da < 25) {
                                Ea = Da;
                                Fa = Ca;
                            }
                            Aa[Ia] = Ca = (Aa[Ia] + 1) >> 0;
                            Da = 27;
                        };
                    } else {
                        ia = Qb(Ha);
                        ja = rb(); {
                            if (Da < 25) {
                                Ea = Da;
                                Fa = Ca;
                            }
                            ja = Ca = (ja + 1) >> 0;
                            Da = 27;
                        };
                        xb(ja);
                    }
                    break;
                case 1:
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7; {
                            if (Da < 25) {
                                Ea = Da;
                                Fa = Ca;
                            }
                            Aa[Ia] = Ca = (Aa[Ia] - 1) >> 0;
                            Da = 30;
                        };
                    } else {
                        ia = Qb(Ha);
                        ja = rb(); {
                            if (Da < 25) {
                                Ea = Da;
                                Fa = Ca;
                            }
                            ja = Ca = (ja - 1) >> 0;
                            Da = 30;
                        };
                        xb(ja);
                    }
                    break;
                case 2:
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = lb();
                    }
                    Ka = (Kb + Lb - Nb);
                    if (Ta) {
                        ia = (Aa[4] - 4) >> 0;
                        xb(Ka);
                        Aa[4] = ia;
                    } else {
                        xd(Ka);
                    }
                    Kb = ja, Lb = Nb = 0;
                    break;
                case 4:
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = lb();
                    }
                    Kb = ja, Lb = Nb = 0;
                    break;
                case 6:
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = lb();
                    } if (Ta) {
                        ia = (Aa[4] - 4) >> 0;
                        xb(ja);
                        Aa[4] = ia;
                    } else {
                        xd(ja);
                    }
                    break;
                case 3:
                case 5:
                    if ((Ha >> 6) == 3) Dc(6);
                    ia = Qb(Ha);
                    ja = lb();
                    ia = (ia + 4) >> 0;
                    Ka = jb();
                    if (Ma == 3) We(1, Ka, ja, (Kb + Lb - Nb));
                    else Ne(Ka, ja);
                    break;
                default:
                    Dc(6);
                }
                break Fd;
            case 0xeb:
                ja = ((Wa[Lb++] << 24) >> 24);;
                Lb = (Lb + ja) >> 0;
                break Fd;
            case 0xe9:
                {
                    ja = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                Lb = (Lb + ja) >> 0;
                break Fd;
            case 0xea:
                if ((((Ga >> 8) & 1) ^ 1)) {
                    {
                        ja = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                        Lb += 4;
                    };
                } else {
                    ja = Pb();
                }
                Ka = Pb();
                Ne(Ka, ja);
                break Fd;
            case 0x70:
                if (Zc()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x71:
                if (!Zc()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x72:
                if (cc()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x73:
                if (!cc()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x74:
                if ((Ca == 0)) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x75:
                if (!(Ca == 0)) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x76:
                if (ad()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x77:
                if (!ad()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x78:
                if ((Da == 24 ? ((Ba >> 7) & 1) : (Ca < 0))) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x79:
                if (!(Da == 24 ? ((Ba >> 7) & 1) : (Ca < 0))) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x7a:
                if (bd()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x7b:
                if (!bd()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x7c:
                if (cd()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x7d:
                if (!cd()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x7e:
                if (dd()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0x7f:
                if (!dd()) {
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Lb = (Lb + ja) >> 0;
                } else {
                    Lb = (Lb + 1) >> 0;
                }
                break Fd;
            case 0xe0:
            case 0xe1:
            case 0xe2:
                ja = ((Wa[Lb++] << 24) >> 24);;
                if (Ga & 0x0080) Ma = 0xffff;
                else Ma = -1;
                Ka = (Aa[1] - 1) & Ma;
                Aa[1] = (Aa[1] & ~Ma) | Ka;
                b &= 3;
                if (b == 0) La = !(Ca == 0);
                else if (b == 1) La = (Ca == 0);
                else La = 1; if (Ka && La) {
                    if (Ga & 0x0100) {
                        Kb = (Kb + Lb - Nb + ja) & 0xffff, Lb = Nb = 0;
                    } else {
                        Lb = (Lb + ja) >> 0;
                    }
                }
                break Fd;
            case 0xe3:
                ja = ((Wa[Lb++] << 24) >> 24);;
                if (Ga & 0x0080) Ma = 0xffff;
                else Ma = -1; if ((Aa[1] & Ma) == 0) {
                    if (Ga & 0x0100) {
                        Kb = (Kb + Lb - Nb + ja) & 0xffff, Lb = Nb = 0;
                    } else {
                        Lb = (Lb + ja) >> 0;
                    }
                }
                break Fd;
            case 0xc2:
                Ka = (Pb() << 16) >> 16;
                ja = Ad();
                Aa[4] = (Aa[4] & ~Sa) | ((Aa[4] + 4 + Ka) & Sa);
                Kb = ja, Lb = Nb = 0;
                break Fd;
            case 0xc3:
                if (Ta) {
                    ia = Aa[4];
                    ja = lb();
                    Aa[4] = (Aa[4] + 4) >> 0;
                } else {
                    ja = Ad();
                    Bd();
                }
                Kb = ja, Lb = Nb = 0;
                break Fd;
            case 0xe8:
                {
                    ja = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                    Lb += 4;
                };
                Ka = (Kb + Lb - Nb);
                if (Ta) {
                    ia = (Aa[4] - 4) >> 0;
                    xb(Ka);
                    Aa[4] = ia;
                } else {
                    xd(Ka);
                }
                Lb = (Lb + ja) >> 0;
                break Fd;
            case 0x9a:
                La = (((Ga >> 8) & 1) ^ 1);
                if (La) {
                    {
                        ja = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                        Lb += 4;
                    };
                } else {
                    ja = Pb();
                }
                Ka = Pb();
                We(La, Ka, ja, (Kb + Lb - Nb)); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0xca:
                Ka = (Pb() << 16) >> 16;
                kf((((Ga >> 8) & 1) ^ 1), Ka); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0xcb:
                kf((((Ga >> 8) & 1) ^ 1), 0); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0xcf:
                jf((((Ga >> 8) & 1) ^ 1)); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0x90:
                break Fd;
            case 0xcc:
                Ka = (Kb + Lb - Nb);
                Ae(3, 1, 0, Ka, 0);
                break Fd;
            case 0xcd:
                ja = Wa[Lb++];;
                if ((za.eflags & 0x00020000) && ((za.eflags >> 12) & 3) != 3) Dc(13);
                Ka = (Kb + Lb - Nb);
                Ae(ja, 1, 0, Ka, 0);
                break Fd;
            case 0xce:
                if (Zc()) {
                    Ka = (Kb + Lb - Nb);
                    Ae(4, 1, 0, Ka, 0);
                }
                break Fd;
            case 0x62:
                Ef();
                break Fd;
            case 0xf5:
                Ba = hd() ^ 0x0001;
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
                break Fd;
            case 0xf8:
                Ba = hd() & ~0x0001;
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
                break Fd;
            case 0xf9:
                Ba = hd() | 0x0001;
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
                break Fd;
            case 0xfc:
                za.df = 1;
                break Fd;
            case 0xfd:
                za.df = -1;
                break Fd;
            case 0xfa:
                Va = (za.eflags >> 12) & 3;
                if (za.cpl > Va) Dc(13);
                za.eflags &= ~0x00000200;
                break Fd;
            case 0xfb:
                Va = (za.eflags >> 12) & 3;
                if (za.cpl > Va) Dc(13);
                za.eflags |= 0x00000200; {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0x9e:
                Ba = ((Aa[0] >> 8) & (0x0080 | 0x0040 | 0x0010 | 0x0004 | 0x0001)) | (Zc() << 11);
                Ca = ((Ba >> 6) & 1) ^ 1;
                Da = 24;
                break Fd;
            case 0x9f:
                ja = id();
                Wb(4, ja);
                break Fd;
            case 0xf4:
                if (za.cpl != 0) Dc(13);
                za.halted = 1;
                Oa = 257;
                break zg;
            case 0xa4:
                ag();
                break Fd;
            case 0xa5:
                tg();
                break Fd;
            case 0xaa:
                cg();
                break Fd;
            case 0xab:
                vg();
                break Fd;
            case 0xa6:
                dg();
                break Fd;
            case 0xa7:
                wg();
                break Fd;
            case 0xac:
                eg();
                break Fd;
            case 0xad:
                xg();
                break Fd;
            case 0xae:
                fg();
                break Fd;
            case 0xaf:
                yg();
                break Fd;
            case 0x6c:
                Tf(); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0x6d:
                ng(); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0x6e:
                Yf(); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0x6f:
                sg(); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0xd8:
            case 0xd9:
            case 0xda:
            case 0xdb:
            case 0xdc:
            case 0xdd:
            case 0xde:
            case 0xdf:
                if (za.cr0 & ((1 << 2) | (1 << 3))) {
                    Dc(7);
                }
                Ha = Wa[Lb++];;
                Ja = (Ha >> 3) & 7;
                Ia = Ha & 7;
                Ma = ((b & 7) << 3) | ((Ha >> 3) & 7);
                Xb(0, 0xffff);
                if ((Ha >> 6) == 3) {} else {
                    ia = Qb(Ha);
                }
                break Fd;
            case 0x9b:
                break Fd;
            case 0xe4:
                Va = (za.eflags >> 12) & 3;
                if (za.cpl > Va) Dc(13);
                ja = Wa[Lb++];;
                Wb(0, za.ld8_port(ja)); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0xe5:
                Va = (za.eflags >> 12) & 3;
                if (za.cpl > Va) Dc(13);
                ja = Wa[Lb++];;
                Aa[0] = za.ld32_port(ja); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0xe6:
                Va = (za.eflags >> 12) & 3;
                if (za.cpl > Va) Dc(13);
                ja = Wa[Lb++];;
                za.st8_port(ja, Aa[0] & 0xff); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0xe7:
                Va = (za.eflags >> 12) & 3;
                if (za.cpl > Va) Dc(13);
                ja = Wa[Lb++];;
                za.st32_port(ja, Aa[0]); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0xec:
                Va = (za.eflags >> 12) & 3;
                if (za.cpl > Va) Dc(13);
                Wb(0, za.ld8_port(Aa[2] & 0xffff)); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0xed:
                Va = (za.eflags >> 12) & 3;
                if (za.cpl > Va) Dc(13);
                Aa[0] = za.ld32_port(Aa[2] & 0xffff); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0xee:
                Va = (za.eflags >> 12) & 3;
                if (za.cpl > Va) Dc(13);
                za.st8_port(Aa[2] & 0xffff, Aa[0] & 0xff); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0xef:
                Va = (za.eflags >> 12) & 3;
                if (za.cpl > Va) Dc(13);
                za.st32_port(Aa[2] & 0xffff, Aa[0]); {
                    if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                };
                break Fd;
            case 0x27:
                Af();
                break Fd;
            case 0x2f:
                Cf();
                break Fd;
            case 0x37:
                wf();
                break Fd;
            case 0x3f:
                zf();
                break Fd;
            case 0xd4:
                ja = Wa[Lb++];;
                sf(ja);
                break Fd;
            case 0xd5:
                ja = Wa[Lb++];;
                vf(ja);
                break Fd;
            case 0x63:
                qf();
                break Fd;
            case 0xd6:
            case 0xf1:
                Dc(6);
                break;
            case 0x0f:
                b = Wa[Lb++];;
                switch (b) {
                case 0x80:
                case 0x81:
                case 0x82:
                case 0x83:
                case 0x84:
                case 0x85:
                case 0x86:
                case 0x87:
                case 0x88:
                case 0x89:
                case 0x8a:
                case 0x8b:
                case 0x8c:
                case 0x8d:
                case 0x8e:
                case 0x8f:
                    {
                        ja = Wa[Lb] | (Wa[Lb + 1] << 8) | (Wa[Lb + 2] << 16) | (Wa[Lb + 3] << 24);
                        Lb += 4;
                    };
                    if (fd(b & 0xf)) Lb = (Lb + ja) >> 0;
                    break Fd;
                case 0x90:
                case 0x91:
                case 0x92:
                case 0x93:
                case 0x94:
                case 0x95:
                case 0x96:
                case 0x97:
                case 0x98:
                case 0x99:
                case 0x9a:
                case 0x9b:
                case 0x9c:
                case 0x9d:
                case 0x9e:
                case 0x9f:
                    Ha = Wa[Lb++];;
                    ja = fd(b & 0xf);
                    if ((Ha >> 6) == 3) {
                        Wb(Ha & 7, ja);
                    } else {
                        ia = Qb(Ha);
                        tb(ja);
                    }
                    break Fd;
                case 0x40:
                case 0x41:
                case 0x42:
                case 0x43:
                case 0x44:
                case 0x45:
                case 0x46:
                case 0x47:
                case 0x48:
                case 0x49:
                case 0x4a:
                case 0x4b:
                case 0x4c:
                case 0x4d:
                case 0x4e:
                case 0x4f:
                    Ha = Wa[Lb++];;
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = lb();
                    } if (fd(b & 0xf)) Aa[(Ha >> 3) & 7] = ja;
                    break Fd;
                case 0xb6:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = (Aa[Ia & 3] >> ((Ia & 4) << 1)) & 0xff;
                    } else {
                        ia = Qb(Ha);
                        ja = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                    }
                    Aa[Ja] = ja;
                    break Fd;
                case 0xb7:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7] & 0xffff;
                    } else {
                        ia = Qb(Ha);
                        ja = jb();
                    }
                    Aa[Ja] = ja;
                    break Fd;
                case 0xbe:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                    } else {
                        ia = Qb(Ha);
                        ja = (((Xa = cb[ia >>> 12]) == -1) ? eb() : Wa[ia ^ Xa]);
                    }
                    Aa[Ja] = (((ja) << 24) >> 24);
                    break Fd;
                case 0xbf:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = jb();
                    }
                    Aa[Ja] = (((ja) << 16) >> 16);
                    break Fd;
                case 0x00:
                    if (!(za.cr0 & (1 << 0)) || (za.eflags & 0x00020000)) Dc(6);
                    Ha = Wa[Lb++];;
                    Ma = (Ha >> 3) & 7;
                    switch (Ma) {
                    case 0:
                    case 1:
                        if (Ma == 0) ja = za.ldt.selector;
                        else ja = za.tr.selector; if ((Ha >> 6) == 3) {
                            Xb(Ha & 7, ja);
                        } else {
                            ia = Qb(Ha);
                            vb(ja);
                        }
                        break;
                    case 2:
                    case 3:
                        if (za.cpl != 0) Dc(13);
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7] & 0xffff;
                        } else {
                            ia = Qb(Ha);
                            ja = jb();
                        } if (Ma == 2) Be(ja);
                        else De(ja);
                        break;
                    case 4:
                    case 5:
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7] & 0xffff;
                        } else {
                            ia = Qb(Ha);
                            ja = jb();
                        }
                        pf(ja, Ma & 1);
                        break;
                    default:
                        Dc(6);
                    }
                    break Fd;
                case 0x01:
                    Ha = Wa[Lb++];;
                    Ma = (Ha >> 3) & 7;
                    switch (Ma) {
                    case 2:
                    case 3:
                        if ((Ha >> 6) == 3) Dc(6);
                        if (this.cpl != 0) Dc(13);
                        ia = Qb(Ha);
                        ja = jb();
                        ia += 2;
                        Ka = lb();
                        if (Ma == 2) {
                            this.gdt.base = Ka;
                            this.gdt.limit = ja;
                        } else {
                            this.idt.base = Ka;
                            this.idt.limit = ja;
                        }
                        break;
                    case 7:
                        if (this.cpl != 0) Dc(13);
                        if ((Ha >> 6) == 3) Dc(6);
                        ia = Qb(Ha);
                        za.tlb_flush_page(ia & -4096);
                        break;
                    default:
                        Dc(6);
                    }
                    break Fd;
                case 0x02:
                case 0x03:
                    nf((((Ga >> 8) & 1) ^ 1), b & 1);
                    break Fd;
                case 0x20:
                    if (za.cpl != 0) Dc(13);
                    Ha = Wa[Lb++];;
                    if ((Ha >> 6) != 3) Dc(6);
                    Ja = (Ha >> 3) & 7;
                    switch (Ja) {
                    case 0:
                        ja = za.cr0;
                        break;
                    case 2:
                        ja = za.cr2;
                        break;
                    case 3:
                        ja = za.cr3;
                        break;
                    case 4:
                        ja = za.cr4;
                        break;
                    default:
                        Dc(6);
                    }
                    Aa[Ha & 7] = ja;
                    break Fd;
                case 0x22:
                    if (za.cpl != 0) Dc(13);
                    Ha = Wa[Lb++];;
                    if ((Ha >> 6) != 3) Dc(6);
                    Ja = (Ha >> 3) & 7;
                    ja = Aa[Ha & 7];
                    switch (Ja) {
                    case 0:
                        Pd(ja);
                        break;
                    case 2:
                        za.cr2 = ja;
                        break;
                    case 3:
                        Rd(ja);
                        break;
                    case 4:
                        Td(ja);
                        break;
                    default:
                        Dc(6);
                    }
                    break Fd;
                case 0x06:
                    if (za.cpl != 0) Dc(13);
                    Pd(za.cr0 & ~(1 << 3));
                    break Fd;
                case 0x23:
                    if (za.cpl != 0) Dc(13);
                    Ha = Wa[Lb++];;
                    if ((Ha >> 6) != 3) Dc(6);
                    Ja = (Ha >> 3) & 7;
                    ja = Aa[Ha & 7];
                    if (Ja == 4 || Ja == 5) Dc(6);
                    break Fd;
                case 0xb2:
                case 0xb4:
                case 0xb5:
                    Rf(b & 7);
                    break Fd;
                case 0xa2:
                    rf();
                    break Fd;
                case 0xa4:
                    Ha = Wa[Lb++];;
                    Ka = Aa[(Ha >> 3) & 7];
                    if ((Ha >> 6) == 3) {
                        La = Wa[Lb++];;
                        Ia = Ha & 7;
                        Aa[Ia] = rc(Aa[Ia], Ka, La);
                    } else {
                        ia = Qb(Ha);
                        La = Wa[Lb++];;
                        ja = rb();
                        ja = rc(ja, Ka, La);
                        xb(ja);
                    }
                    break Fd;
                case 0xa5:
                    Ha = Wa[Lb++];;
                    Ka = Aa[(Ha >> 3) & 7];
                    La = Aa[1];
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Aa[Ia] = rc(Aa[Ia], Ka, La);
                    } else {
                        ia = Qb(Ha);
                        ja = rb();
                        ja = rc(ja, Ka, La);
                        xb(ja);
                    }
                    break Fd;
                case 0xac:
                    Ha = Wa[Lb++];;
                    Ka = Aa[(Ha >> 3) & 7];
                    if ((Ha >> 6) == 3) {
                        La = Wa[Lb++];;
                        Ia = Ha & 7;
                        Aa[Ia] = sc(Aa[Ia], Ka, La);
                    } else {
                        ia = Qb(Ha);
                        La = Wa[Lb++];;
                        ja = rb();
                        ja = sc(ja, Ka, La);
                        xb(ja);
                    }
                    break Fd;
                case 0xad:
                    Ha = Wa[Lb++];;
                    Ka = Aa[(Ha >> 3) & 7];
                    La = Aa[1];
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Aa[Ia] = sc(Aa[Ia], Ka, La);
                    } else {
                        ia = Qb(Ha);
                        ja = rb();
                        ja = sc(ja, Ka, La);
                        xb(ja);
                    }
                    break Fd;
                case 0xba:
                    Ha = Wa[Lb++];;
                    Ma = (Ha >> 3) & 7;
                    switch (Ma) {
                    case 4:
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7];
                            Ka = Wa[Lb++];;
                        } else {
                            ia = Qb(Ha);
                            Ka = Wa[Lb++];;
                            ja = lb();
                        }
                        uc(ja, Ka);
                        break;
                    case 5:
                    case 6:
                    case 7:
                        if ((Ha >> 6) == 3) {
                            Ia = Ha & 7;
                            Ka = Wa[Lb++];;
                            Aa[Ia] = xc(Ma & 3, Aa[Ia], Ka);
                        } else {
                            ia = Qb(Ha);
                            Ka = Wa[Lb++];;
                            ja = rb();
                            ja = xc(Ma & 3, ja, Ka);
                            xb(ja);
                        }
                        break;
                    default:
                        Dc(6);
                    }
                    break Fd;
                case 0xa3:
                    Ha = Wa[Lb++];;
                    Ka = Aa[(Ha >> 3) & 7];
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ia = (ia + ((Ka >> 5) << 2)) >> 0;
                        ja = lb();
                    }
                    uc(ja, Ka);
                    break Fd;
                case 0xab:
                case 0xb3:
                case 0xbb:
                    Ha = Wa[Lb++];;
                    Ka = Aa[(Ha >> 3) & 7];
                    Ma = (b >> 3) & 3;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Aa[Ia] = xc(Ma, Aa[Ia], Ka);
                    } else {
                        ia = Qb(Ha);
                        ia = (ia + ((Ka >> 5) << 2)) >> 0;
                        ja = rb();
                        ja = xc(Ma, ja, Ka);
                        xb(ja);
                    }
                    break Fd;
                case 0xbc:
                case 0xbd:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ka = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        Ka = lb();
                    } if (b & 1) Aa[Ja] = Bc(Aa[Ja], Ka);
                    else Aa[Ja] = zc(Aa[Ja], Ka);
                    break Fd;
                case 0xaf:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ka = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        Ka = lb();
                    }
                    Aa[Ja] = Wc(Aa[Ja], Ka);
                    break Fd;
                case 0x31:
                    if ((za.cr4 & (1 << 2)) && za.cpl != 0) Dc(13);
                    ja = md();
                    Aa[0] = ja >>> 0;
                    Aa[2] = (ja / 0x100000000) >>> 0;
                    break Fd;
                case 0xc0:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                        Ka = gc(0, ja, (Aa[Ja & 3] >> ((Ja & 4) << 1)));
                        Wb(Ja, ja);
                        Wb(Ia, Ka);
                    } else {
                        ia = Qb(Ha);
                        ja = nb();
                        Ka = gc(0, ja, (Aa[Ja & 3] >> ((Ja & 4) << 1)));
                        tb(Ka);
                        Wb(Ja, ja);
                    }
                    break Fd;
                case 0xc1:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = Aa[Ia];
                        Ka = Yb(0, ja, Aa[Ja]);
                        Aa[Ja] = ja;
                        Aa[Ia] = Ka;
                    } else {
                        ia = Qb(Ha);
                        ja = rb();
                        Ka = Yb(0, ja, Aa[Ja]);
                        xb(Ka);
                        Aa[Ja] = ja;
                    }
                    break Fd;
                case 0xb0:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                        Ka = gc(5, Aa[0], ja);
                        if (Ka == 0) {
                            Wb(Ia, (Aa[Ja & 3] >> ((Ja & 4) << 1)));
                        } else {
                            Wb(0, ja);
                        }
                    } else {
                        ia = Qb(Ha);
                        ja = nb();
                        Ka = gc(5, Aa[0], ja);
                        if (Ka == 0) {
                            tb((Aa[Ja & 3] >> ((Ja & 4) << 1)));
                        } else {
                            Wb(0, ja);
                        }
                    }
                    break Fd;
                case 0xb1:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = Aa[Ia];
                        Ka = Yb(5, Aa[0], ja);
                        if (Ka == 0) {
                            Aa[Ia] = Aa[Ja];
                        } else {
                            Aa[0] = ja;
                        }
                    } else {
                        ia = Qb(Ha);
                        ja = rb();
                        Ka = Yb(5, Aa[0], ja);
                        if (Ka == 0) {
                            xb(Aa[Ja]);
                        } else {
                            Aa[0] = ja;
                        }
                    }
                    break Fd;
                case 0xa0:
                case 0xa8:
                    xd(za.segs[(b >> 3) & 7].selector);
                    break Fd;
                case 0xa1:
                case 0xa9:
                    He((b >> 3) & 7, Ad() & 0xffff);
                    Bd();
                    break Fd;
                case 0xc8:
                case 0xc9:
                case 0xca:
                case 0xcb:
                case 0xcc:
                case 0xcd:
                case 0xce:
                case 0xcf:
                    Ja = b & 7;
                    ja = Aa[Ja];
                    ja = (ja >>> 24) | ((ja >> 8) & 0x0000ff00) | ((ja << 8) & 0x00ff0000) | (ja << 24);
                    Aa[Ja] = ja;
                    break Fd;
                case 0x04:
                case 0x05:
                case 0x07:
                case 0x08:
                case 0x09:
                case 0x0a:
                case 0x0b:
                case 0x0c:
                case 0x0d:
                case 0x0e:
                case 0x0f:
                case 0x10:
                case 0x11:
                case 0x12:
                case 0x13:
                case 0x14:
                case 0x15:
                case 0x16:
                case 0x17:
                case 0x18:
                case 0x19:
                case 0x1a:
                case 0x1b:
                case 0x1c:
                case 0x1d:
                case 0x1e:
                case 0x1f:
                case 0x21:
                case 0x24:
                case 0x25:
                case 0x26:
                case 0x27:
                case 0x28:
                case 0x29:
                case 0x2a:
                case 0x2b:
                case 0x2c:
                case 0x2d:
                case 0x2e:
                case 0x2f:
                case 0x30:
                case 0x32:
                case 0x33:
                case 0x34:
                case 0x35:
                case 0x36:
                case 0x37:
                case 0x38:
                case 0x39:
                case 0x3a:
                case 0x3b:
                case 0x3c:
                case 0x3d:
                case 0x3e:
                case 0x3f:
                case 0x50:
                case 0x51:
                case 0x52:
                case 0x53:
                case 0x54:
                case 0x55:
                case 0x56:
                case 0x57:
                case 0x58:
                case 0x59:
                case 0x5a:
                case 0x5b:
                case 0x5c:
                case 0x5d:
                case 0x5e:
                case 0x5f:
                case 0x60:
                case 0x61:
                case 0x62:
                case 0x63:
                case 0x64:
                case 0x65:
                case 0x66:
                case 0x67:
                case 0x68:
                case 0x69:
                case 0x6a:
                case 0x6b:
                case 0x6c:
                case 0x6d:
                case 0x6e:
                case 0x6f:
                case 0x70:
                case 0x71:
                case 0x72:
                case 0x73:
                case 0x74:
                case 0x75:
                case 0x76:
                case 0x77:
                case 0x78:
                case 0x79:
                case 0x7a:
                case 0x7b:
                case 0x7c:
                case 0x7d:
                case 0x7e:
                case 0x7f:
                case 0xa6:
                case 0xa7:
                case 0xaa:
                case 0xae:
                case 0xb8:
                case 0xb9:
                case 0xc2:
                case 0xc3:
                case 0xc4:
                case 0xc5:
                case 0xc6:
                case 0xc7:
                case 0xd0:
                case 0xd1:
                case 0xd2:
                case 0xd3:
                case 0xd4:
                case 0xd5:
                case 0xd6:
                case 0xd7:
                case 0xd8:
                case 0xd9:
                case 0xda:
                case 0xdb:
                case 0xdc:
                case 0xdd:
                case 0xde:
                case 0xdf:
                case 0xe0:
                case 0xe1:
                case 0xe2:
                case 0xe3:
                case 0xe4:
                case 0xe5:
                case 0xe6:
                case 0xe7:
                case 0xe8:
                case 0xe9:
                case 0xea:
                case 0xeb:
                case 0xec:
                case 0xed:
                case 0xee:
                case 0xef:
                case 0xf0:
                case 0xf1:
                case 0xf2:
                case 0xf3:
                case 0xf4:
                case 0xf5:
                case 0xf6:
                case 0xf7:
                case 0xf8:
                case 0xf9:
                case 0xfa:
                case 0xfb:
                case 0xfc:
                case 0xfd:
                case 0xfe:
                case 0xff:
                default:
                    Dc(6);
                }
                break;
            default:
                switch (b) {
                case 0x189:
                    Ha = Wa[Lb++];;
                    ja = Aa[(Ha >> 3) & 7];
                    if ((Ha >> 6) == 3) {
                        Xb(Ha & 7, ja);
                    } else {
                        ia = Qb(Ha);
                        vb(ja);
                    }
                    break Fd;
                case 0x18b:
                    Ha = Wa[Lb++];;
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = jb();
                    }
                    Xb((Ha >> 3) & 7, ja);
                    break Fd;
                case 0x1b8:
                case 0x1b9:
                case 0x1ba:
                case 0x1bb:
                case 0x1bc:
                case 0x1bd:
                case 0x1be:
                case 0x1bf:
                    Xb(b & 7, Pb());
                    break Fd;
                case 0x1a1:
                    ia = Vb();
                    ja = jb();
                    Xb(0, ja);
                    break Fd;
                case 0x1a3:
                    ia = Vb();
                    vb(Aa[0]);
                    break Fd;
                case 0x1c7:
                    Ha = Wa[Lb++];;
                    if ((Ha >> 6) == 3) {
                        ja = Pb();
                        Xb(Ha & 7, ja);
                    } else {
                        ia = Qb(Ha);
                        ja = Pb();
                        vb(ja);
                    }
                    break Fd;
                case 0x191:
                case 0x192:
                case 0x193:
                case 0x194:
                case 0x195:
                case 0x196:
                case 0x197:
                    Ja = b & 7;
                    ja = Aa[0];
                    Xb(0, Aa[Ja]);
                    Xb(Ja, ja);
                    break Fd;
                case 0x187:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        ja = Aa[Ia];
                        Xb(Ia, Aa[Ja]);
                    } else {
                        ia = Qb(Ha);
                        ja = pb();
                        vb(Aa[Ja]);
                    }
                    Xb(Ja, ja);
                    break Fd;
                case 0x1c4:
                    Sf(0);
                    break Fd;
                case 0x1c5:
                    Sf(3);
                    break Fd;
                case 0x101:
                case 0x109:
                case 0x111:
                case 0x119:
                case 0x121:
                case 0x129:
                case 0x131:
                case 0x139:
                    Ha = Wa[Lb++];;
                    Ma = (b >> 3) & 7;
                    Ka = Aa[(Ha >> 3) & 7];
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Xb(Ia, dc(Ma, Aa[Ia], Ka));
                    } else {
                        ia = Qb(Ha);
                        if (Ma != 7) {
                            ja = pb();
                            ja = dc(Ma, ja, Ka);
                            vb(ja);
                        } else {
                            ja = jb();
                            dc(7, ja, Ka);
                        }
                    }
                    break Fd;
                case 0x103:
                case 0x10b:
                case 0x113:
                case 0x11b:
                case 0x123:
                case 0x12b:
                case 0x133:
                case 0x13b:
                    Ha = Wa[Lb++];;
                    Ma = (b >> 3) & 7;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ka = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        Ka = jb();
                    }
                    Xb(Ja, dc(Ma, Aa[Ja], Ka));
                    break Fd;
                case 0x105:
                case 0x10d:
                case 0x115:
                case 0x11d:
                case 0x125:
                case 0x12d:
                case 0x135:
                case 0x13d:
                    Ka = Pb();
                    Ma = (b >> 3) & 7;
                    Xb(0, dc(Ma, Aa[0], Ka));
                    break Fd;
                case 0x181:
                    Ha = Wa[Lb++];;
                    Ma = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Ka = Pb();
                        Aa[Ia] = dc(Ma, Aa[Ia], Ka);
                    } else {
                        ia = Qb(Ha);
                        Ka = Pb();
                        if (Ma != 7) {
                            ja = pb();
                            ja = dc(Ma, ja, Ka);
                            vb(ja);
                        } else {
                            ja = jb();
                            dc(7, ja, Ka);
                        }
                    }
                    break Fd;
                case 0x183:
                    Ha = Wa[Lb++];;
                    Ma = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Ka = ((Wa[Lb++] << 24) >> 24);;
                        Xb(Ia, dc(Ma, Aa[Ia], Ka));
                    } else {
                        ia = Qb(Ha);
                        Ka = ((Wa[Lb++] << 24) >> 24);;
                        if (Ma != 7) {
                            ja = pb();
                            ja = dc(Ma, ja, Ka);
                            vb(ja);
                        } else {
                            ja = jb();
                            dc(7, ja, Ka);
                        }
                    }
                    break Fd;
                case 0x140:
                case 0x141:
                case 0x142:
                case 0x143:
                case 0x144:
                case 0x145:
                case 0x146:
                case 0x147:
                    Ja = b & 7;
                    Xb(Ja, ec(Aa[Ja]));
                    break Fd;
                case 0x148:
                case 0x149:
                case 0x14a:
                case 0x14b:
                case 0x14c:
                case 0x14d:
                case 0x14e:
                case 0x14f:
                    Ja = b & 7;
                    Xb(Ja, fc(Aa[Ja]));
                    break Fd;
                case 0x16b:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ka = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        Ka = jb();
                    }
                    La = ((Wa[Lb++] << 24) >> 24);;
                    Xb(Ja, Rc(Ka, La));
                    break Fd;
                case 0x169:
                    Ha = Wa[Lb++];;
                    Ja = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ka = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        Ka = jb();
                    }
                    La = Pb();
                    Xb(Ja, Rc(Ka, La));
                    break Fd;
                case 0x185:
                    Ha = Wa[Lb++];;
                    if ((Ha >> 6) == 3) {
                        ja = Aa[Ha & 7];
                    } else {
                        ia = Qb(Ha);
                        ja = jb();
                    }
                    Ka = Aa[(Ha >> 3) & 7]; {
                        Ca = (((ja & Ka) << 16) >> 16);
                        Da = 13;
                    };
                    break Fd;
                case 0x1a9:
                    Ka = Pb(); {
                        Ca = (((Aa[0] & Ka) << 16) >> 16);
                        Da = 13;
                    };
                    break Fd;
                case 0x1f7:
                    Ha = Wa[Lb++];;
                    Ma = (Ha >> 3) & 7;
                    switch (Ma) {
                    case 0:
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7];
                        } else {
                            ia = Qb(Ha);
                            ja = jb();
                        }
                        Ka = Pb(); {
                            Ca = (((ja & Ka) << 16) >> 16);
                            Da = 13;
                        };
                        break;
                    case 2:
                        if ((Ha >> 6) == 3) {
                            Ia = Ha & 7;
                            Xb(Ia, ~Aa[Ia]);
                        } else {
                            ia = Qb(Ha);
                            ja = pb();
                            ja = ~ja;
                            vb(ja);
                        }
                        break;
                    case 3:
                        if ((Ha >> 6) == 3) {
                            Ia = Ha & 7;
                            Xb(Ia, dc(5, 0, Aa[Ia]));
                        } else {
                            ia = Qb(Ha);
                            ja = pb();
                            ja = dc(5, 0, ja);
                            vb(ja);
                        }
                        break;
                    case 4:
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7];
                        } else {
                            ia = Qb(Ha);
                            ja = jb();
                        }
                        ja = Qc(Aa[0], ja);
                        Xb(0, ja);
                        Xb(2, ja >> 16);
                        break;
                    case 5:
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7];
                        } else {
                            ia = Qb(Ha);
                            ja = jb();
                        }
                        ja = Rc(Aa[0], ja);
                        Xb(0, ja);
                        Xb(2, ja >> 16);
                        break;
                    case 6:
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7];
                        } else {
                            ia = Qb(Ha);
                            ja = jb();
                        }
                        Fc(ja);
                        break;
                    case 7:
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7];
                        } else {
                            ia = Qb(Ha);
                            ja = jb();
                        }
                        Gc(ja);
                        break;
                    default:
                        Dc(6);
                    }
                    break Fd;
                case 0x1c1:
                    Ha = Wa[Lb++];;
                    Ma = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ka = Wa[Lb++];;
                        Ia = Ha & 7;
                        Xb(Ia, mc(Ma, Aa[Ia], Ka));
                    } else {
                        ia = Qb(Ha);
                        Ka = Wa[Lb++];;
                        ja = pb();
                        ja = mc(Ma, ja, Ka);
                        vb(ja);
                    }
                    break Fd;
                case 0x1d1:
                    Ha = Wa[Lb++];;
                    Ma = (Ha >> 3) & 7;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Xb(Ia, mc(Ma, Aa[Ia], 1));
                    } else {
                        ia = Qb(Ha);
                        ja = pb();
                        ja = mc(Ma, ja, 1);
                        vb(ja);
                    }
                    break Fd;
                case 0x1d3:
                    Ha = Wa[Lb++];;
                    Ma = (Ha >> 3) & 7;
                    Ka = Aa[1] & 0xff;
                    if ((Ha >> 6) == 3) {
                        Ia = Ha & 7;
                        Xb(Ia, mc(Ma, Aa[Ia], Ka));
                    } else {
                        ia = Qb(Ha);
                        ja = pb();
                        ja = mc(Ma, ja, Ka);
                        vb(ja);
                    }
                    break Fd;
                case 0x198:
                    Xb(0, (Aa[0] << 24) >> 24);
                    break Fd;
                case 0x199:
                    Xb(2, (Aa[0] << 16) >> 31);
                    break Fd;
                case 0x190:
                    break Fd;
                case 0x150:
                case 0x151:
                case 0x152:
                case 0x153:
                case 0x154:
                case 0x155:
                case 0x156:
                case 0x157:
                    vd(Aa[b & 7]);
                    break Fd;
                case 0x158:
                case 0x159:
                case 0x15a:
                case 0x15b:
                case 0x15c:
                case 0x15d:
                case 0x15e:
                case 0x15f:
                    ja = yd();
                    zd();
                    Xb(b & 7, ja);
                    break Fd;
                case 0x160:
                    Gf();
                    break Fd;
                case 0x161:
                    If();
                    break Fd;
                case 0x18f:
                    Ha = Wa[Lb++];;
                    if ((Ha >> 6) == 3) {
                        ja = yd();
                        zd();
                        Xb(Ha & 7, ja);
                    } else {
                        ja = yd();
                        Ka = Aa[4];
                        zd();
                        La = Aa[4];
                        ia = Qb(Ha);
                        Aa[4] = Ka;
                        vb(ja);
                        Aa[4] = La;
                    }
                    break Fd;
                case 0x168:
                    ja = Pb();
                    vd(ja);
                    break Fd;
                case 0x16a:
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    vd(ja);
                    break Fd;
                case 0x1c8:
                    Mf();
                    break Fd;
                case 0x1c9:
                    Kf();
                    break Fd;
                case 0x106:
                case 0x10e:
                case 0x116:
                case 0x11e:
                    vd(za.segs[(b >> 3) & 3].selector);
                    break Fd;
                case 0x107:
                case 0x117:
                case 0x11f:
                    He((b >> 3) & 3, yd());
                    zd();
                    break Fd;
                case 0x18d:
                    Ha = Wa[Lb++];;
                    if ((Ha >> 6) == 3) Dc(6);
                    Ga = (Ga & ~0x000f) | (6 + 1);
                    Xb((Ha >> 3) & 7, Qb(Ha));
                    break Fd;
                case 0x1ff:
                    Ha = Wa[Lb++];;
                    Ma = (Ha >> 3) & 7;
                    switch (Ma) {
                    case 0:
                        if ((Ha >> 6) == 3) {
                            Ia = Ha & 7;
                            Xb(Ia, ec(Aa[Ia]));
                        } else {
                            ia = Qb(Ha);
                            ja = pb();
                            ja = ec(ja);
                            vb(ja);
                        }
                        break;
                    case 1:
                        if ((Ha >> 6) == 3) {
                            Ia = Ha & 7;
                            Xb(Ia, fc(Aa[Ia]));
                        } else {
                            ia = Qb(Ha);
                            ja = pb();
                            ja = fc(ja);
                            vb(ja);
                        }
                        break;
                    case 2:
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7] & 0xffff;
                        } else {
                            ia = Qb(Ha);
                            ja = jb();
                        }
                        vd((Kb + Lb - Nb));
                        Kb = ja, Lb = Nb = 0;
                        break;
                    case 4:
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7] & 0xffff;
                        } else {
                            ia = Qb(Ha);
                            ja = jb();
                        }
                        Kb = ja, Lb = Nb = 0;
                        break;
                    case 6:
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7];
                        } else {
                            ia = Qb(Ha);
                            ja = jb();
                        }
                        vd(ja);
                        break;
                    case 3:
                    case 5:
                        if ((Ha >> 6) == 3) Dc(6);
                        ia = Qb(Ha);
                        ja = jb();
                        ia = (ia + 2) >> 0;
                        Ka = jb();
                        if (Ma == 3) We(0, Ka, ja, (Kb + Lb - Nb));
                        else Ne(Ka, ja);
                        break;
                    default:
                        Dc(6);
                    }
                    break Fd;
                case 0x1eb:
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Kb = (Kb + Lb - Nb + ja) & 0xffff, Lb = Nb = 0;
                    break Fd;
                case 0x1e9:
                    ja = Pb();
                    Kb = (Kb + Lb - Nb + ja) & 0xffff, Lb = Nb = 0;
                    break Fd;
                case 0x170:
                case 0x171:
                case 0x172:
                case 0x173:
                case 0x174:
                case 0x175:
                case 0x176:
                case 0x177:
                case 0x178:
                case 0x179:
                case 0x17a:
                case 0x17b:
                case 0x17c:
                case 0x17d:
                case 0x17e:
                case 0x17f:
                    ja = ((Wa[Lb++] << 24) >> 24);;
                    Ka = fd(b & 0xf);
                    if (Ka) Kb = (Kb + Lb - Nb + ja) & 0xffff, Lb = Nb = 0;
                    break Fd;
                case 0x1c2:
                    Ka = (Pb() << 16) >> 16;
                    ja = yd();
                    Aa[4] = (Aa[4] & ~Sa) | ((Aa[4] + 2 + Ka) & Sa);
                    Kb = ja, Lb = Nb = 0;
                    break Fd;
                case 0x1c3:
                    ja = yd();
                    zd();
                    Kb = ja, Lb = Nb = 0;
                    break Fd;
                case 0x1e8:
                    ja = Pb();
                    vd((Kb + Lb - Nb));
                    Kb = (Kb + Lb - Nb + ja) & 0xffff, Lb = Nb = 0;
                    break Fd;
                case 0x162:
                    Ff();
                    break Fd;
                case 0x1a5:
                    ig();
                    break Fd;
                case 0x1a7:
                    kg();
                    break Fd;
                case 0x1ad:
                    lg();
                    break Fd;
                case 0x1af:
                    mg();
                    break Fd;
                case 0x1ab:
                    jg();
                    break Fd;
                case 0x16d:
                    gg(); {
                        if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                    };
                    break Fd;
                case 0x16f:
                    hg(); {
                        if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                    };
                    break Fd;
                case 0x1e5:
                    Va = (za.eflags >> 12) & 3;
                    if (za.cpl > Va) Dc(13);
                    ja = Wa[Lb++];;
                    Xb(0, za.ld16_port(ja)); {
                        if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                    };
                    break Fd;
                case 0x1e7:
                    Va = (za.eflags >> 12) & 3;
                    if (za.cpl > Va) Dc(13);
                    ja = Wa[Lb++];;
                    za.st16_port(ja, Aa[0] & 0xffff); {
                        if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                    };
                    break Fd;
                case 0x1ed:
                    Va = (za.eflags >> 12) & 3;
                    if (za.cpl > Va) Dc(13);
                    Xb(0, za.ld16_port(Aa[2] & 0xffff)); {
                        if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                    };
                    break Fd;
                case 0x1ef:
                    Va = (za.eflags >> 12) & 3;
                    if (za.cpl > Va) Dc(13);
                    za.st16_port(Aa[2] & 0xffff, Aa[0] & 0xffff); {
                        if (za.hard_irq != 0 && (za.eflags & 0x00000200)) break zg;
                    };
                    break Fd;
                case 0x166:
                case 0x167:
                case 0x1f0:
                case 0x1f2:
                case 0x1f3:
                case 0x126:
                case 0x12e:
                case 0x136:
                case 0x13e:
                case 0x164:
                case 0x165:
                case 0x100:
                case 0x108:
                case 0x110:
                case 0x118:
                case 0x120:
                case 0x128:
                case 0x130:
                case 0x138:
                case 0x102:
                case 0x10a:
                case 0x112:
                case 0x11a:
                case 0x122:
                case 0x12a:
                case 0x132:
                case 0x13a:
                case 0x104:
                case 0x10c:
                case 0x114:
                case 0x11c:
                case 0x124:
                case 0x12c:
                case 0x134:
                case 0x13c:
                case 0x1a0:
                case 0x1a2:
                case 0x1d8:
                case 0x1d9:
                case 0x1da:
                case 0x1db:
                case 0x1dc:
                case 0x1dd:
                case 0x1de:
                case 0x1df:
                case 0x184:
                case 0x1a8:
                case 0x1f6:
                case 0x1c0:
                case 0x1d0:
                case 0x1d2:
                case 0x1fe:
                case 0x1cd:
                case 0x1ce:
                case 0x1f5:
                case 0x1f8:
                case 0x1f9:
                case 0x1fc:
                case 0x1fd:
                case 0x1fa:
                case 0x1fb:
                case 0x19e:
                case 0x19f:
                case 0x1f4:
                case 0x127:
                case 0x12f:
                case 0x137:
                case 0x13f:
                case 0x1d4:
                case 0x1d5:
                case 0x16c:
                case 0x16e:
                case 0x1a4:
                case 0x1a6:
                case 0x1aa:
                case 0x1ac:
                case 0x1ae:
                case 0x180:
                case 0x182:
                case 0x186:
                case 0x188:
                case 0x18a:
                case 0x18c:
                case 0x18e:
                case 0x19b:
                case 0x1b0:
                case 0x1b1:
                case 0x1b2:
                case 0x1b3:
                case 0x1b4:
                case 0x1b5:
                case 0x1b6:
                case 0x1b7:
                case 0x1c6:
                case 0x1cc:
                case 0x1d7:
                case 0x1e4:
                case 0x1e6:
                case 0x1ec:
                case 0x1ee:
                case 0x1cf:
                case 0x1ca:
                case 0x1cb:
                case 0x19a:
                case 0x19c:
                case 0x19d:
                case 0x1ea:
                case 0x1e0:
                case 0x1e1:
                case 0x1e2:
                case 0x1e3:
                    b &= 0xff;
                    break;
                case 0x163:
                case 0x1d6:
                case 0x1f1:
                default:
                    Dc(6);
                case 0x10f:
                    b = Wa[Lb++];;
                    b |= 0x0100;
                    switch (b) {
                    case 0x180:
                    case 0x181:
                    case 0x182:
                    case 0x183:
                    case 0x184:
                    case 0x185:
                    case 0x186:
                    case 0x187:
                    case 0x188:
                    case 0x189:
                    case 0x18a:
                    case 0x18b:
                    case 0x18c:
                    case 0x18d:
                    case 0x18e:
                    case 0x18f:
                        ja = Pb();
                        if (fd(b & 0xf)) Kb = (Kb + Lb - Nb + ja) & 0xffff, Lb = Nb = 0;
                        break Fd;
                    case 0x140:
                    case 0x141:
                    case 0x142:
                    case 0x143:
                    case 0x144:
                    case 0x145:
                    case 0x146:
                    case 0x147:
                    case 0x148:
                    case 0x149:
                    case 0x14a:
                    case 0x14b:
                    case 0x14c:
                    case 0x14d:
                    case 0x14e:
                    case 0x14f:
                        Ha = Wa[Lb++];;
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7];
                        } else {
                            ia = Qb(Ha);
                            ja = jb();
                        } if (fd(b & 0xf)) Xb((Ha >> 3) & 7, ja);
                        break Fd;
                    case 0x1b6:
                        Ha = Wa[Lb++];;
                        Ja = (Ha >> 3) & 7;
                        if ((Ha >> 6) == 3) {
                            Ia = Ha & 7;
                            ja = (Aa[Ia & 3] >> ((Ia & 4) << 1)) & 0xff;
                        } else {
                            ia = Qb(Ha);
                            ja = hb();
                        }
                        Xb(Ja, ja);
                        break Fd;
                    case 0x1be:
                        Ha = Wa[Lb++];;
                        Ja = (Ha >> 3) & 7;
                        if ((Ha >> 6) == 3) {
                            Ia = Ha & 7;
                            ja = (Aa[Ia & 3] >> ((Ia & 4) << 1));
                        } else {
                            ia = Qb(Ha);
                            ja = hb();
                        }
                        Xb(Ja, (((ja) << 24) >> 24));
                        break Fd;
                    case 0x1af:
                        Ha = Wa[Lb++];;
                        Ja = (Ha >> 3) & 7;
                        if ((Ha >> 6) == 3) {
                            Ka = Aa[Ha & 7];
                        } else {
                            ia = Qb(Ha);
                            Ka = jb();
                        }
                        Xb(Ja, Rc(Aa[Ja], Ka));
                        break Fd;
                    case 0x1c1:
                        Ha = Wa[Lb++];;
                        Ja = (Ha >> 3) & 7;
                        if ((Ha >> 6) == 3) {
                            Ia = Ha & 7;
                            ja = Aa[Ia];
                            Ka = dc(0, ja, Aa[Ja]);
                            Xb(Ja, ja);
                            Xb(Ia, Ka);
                        } else {
                            ia = Qb(Ha);
                            ja = pb();
                            Ka = dc(0, ja, Aa[Ja]);
                            vb(Ka);
                            Xb(Ja, ja);
                        }
                        break Fd;
                    case 0x1a0:
                    case 0x1a8:
                        vd(za.segs[(b >> 3) & 7].selector);
                        break Fd;
                    case 0x1a1:
                    case 0x1a9:
                        He((b >> 3) & 7, yd());
                        zd();
                        break Fd;
                    case 0x1b2:
                    case 0x1b4:
                    case 0x1b5:
                        Sf(b & 7);
                        break Fd;
                    case 0x1a4:
                    case 0x1ac:
                        Ha = Wa[Lb++];;
                        Ka = Aa[(Ha >> 3) & 7];
                        Ma = (b >> 3) & 1;
                        if ((Ha >> 6) == 3) {
                            La = Wa[Lb++];;
                            Ia = Ha & 7;
                            Xb(Ia, oc(Ma, Aa[Ia], Ka, La));
                        } else {
                            ia = Qb(Ha);
                            La = Wa[Lb++];;
                            ja = pb();
                            ja = oc(Ma, ja, Ka, La);
                            vb(ja);
                        }
                        break Fd;
                    case 0x1a5:
                    case 0x1ad:
                        Ha = Wa[Lb++];;
                        Ka = Aa[(Ha >> 3) & 7];
                        La = Aa[1];
                        Ma = (b >> 3) & 1;
                        if ((Ha >> 6) == 3) {
                            Ia = Ha & 7;
                            Xb(Ia, oc(Ma, Aa[Ia], Ka, La));
                        } else {
                            ia = Qb(Ha);
                            ja = pb();
                            ja = oc(Ma, ja, Ka, La);
                            vb(ja);
                        }
                        break Fd;
                    case 0x1ba:
                        Ha = Wa[Lb++];;
                        Ma = (Ha >> 3) & 7;
                        switch (Ma) {
                        case 4:
                            if ((Ha >> 6) == 3) {
                                ja = Aa[Ha & 7];
                                Ka = Wa[Lb++];;
                            } else {
                                ia = Qb(Ha);
                                Ka = Wa[Lb++];;
                                ja = jb();
                            }
                            tc(ja, Ka);
                            break;
                        case 5:
                        case 6:
                        case 7:
                            if ((Ha >> 6) == 3) {
                                Ia = Ha & 7;
                                Ka = Wa[Lb++];;
                                Aa[Ia] = vc(Ma & 3, Aa[Ia], Ka);
                            } else {
                                ia = Qb(Ha);
                                Ka = Wa[Lb++];;
                                ja = pb();
                                ja = vc(Ma & 3, ja, Ka);
                                vb(ja);
                            }
                            break;
                        default:
                            Dc(6);
                        }
                        break Fd;
                    case 0x1a3:
                        Ha = Wa[Lb++];;
                        Ka = Aa[(Ha >> 3) & 7];
                        if ((Ha >> 6) == 3) {
                            ja = Aa[Ha & 7];
                        } else {
                            ia = Qb(Ha);
                            ia = (ia + (((Ka & 0xffff) >> 4) << 1)) >> 0;
                            ja = jb();
                        }
                        tc(ja, Ka);
                        break Fd;
                    case 0x1ab:
                    case 0x1b3:
                    case 0x1bb:
                        Ha = Wa[Lb++];;
                        Ka = Aa[(Ha >> 3) & 7];
                        Ma = (b >> 3) & 3;
                        if ((Ha >> 6) == 3) {
                            Ia = Ha & 7;
                            Xb(Ia, vc(Ma, Aa[Ia], Ka));
                        } else {
                            ia = Qb(Ha);
                            ia = (ia + (((Ka & 0xffff) >> 4) << 1)) >> 0;
                            ja = pb();
                            ja = vc(Ma, ja, Ka);
                            vb(ja);
                        }
                        break Fd;
                    case 0x1bc:
                    case 0x1bd:
                        Ha = Wa[Lb++];;
                        Ja = (Ha >> 3) & 7;
                        if ((Ha >> 6) == 3) {
                            Ka = Aa[Ha & 7];
                        } else {
                            ia = Qb(Ha);
                            Ka = jb();
                        }
                        ja = Aa[Ja];
                        if (b & 1) ja = Ac(ja, Ka);
                        else ja = yc(ja, Ka);
                        Xb(Ja, ja);
                        break Fd;
                    case 0x1b1:
                        Ha = Wa[Lb++];;
                        Ja = (Ha >> 3) & 7;
                        if ((Ha >> 6) == 3) {
                            Ia = Ha & 7;
                            ja = Aa[Ia];
                            Ka = dc(5, Aa[0], ja);
                            if (Ka == 0) {
                                Xb(Ia, Aa[Ja]);
                            } else {
                                Xb(0, ja);
                            }
                        } else {
                            ia = Qb(Ha);
                            ja = pb();
                            Ka = dc(5, Aa[0], ja);
                            if (Ka == 0) {
                                vb(Aa[Ja]);
                            } else {
                                Xb(0, ja);
                            }
                        }
                        break Fd;
                    case 0x100:
                    case 0x101:
                    case 0x102:
                    case 0x103:
                    case 0x120:
                    case 0x122:
                    case 0x106:
                    case 0x123:
                    case 0x1a2:
                    case 0x131:
                    case 0x190:
                    case 0x191:
                    case 0x192:
                    case 0x193:
                    case 0x194:
                    case 0x195:
                    case 0x196:
                    case 0x197:
                    case 0x198:
                    case 0x199:
                    case 0x19a:
                    case 0x19b:
                    case 0x19c:
                    case 0x19d:
                    case 0x19e:
                    case 0x19f:
                    case 0x1b0:
                        b = 0x0f;
                        Lb--;
                        break;
                    case 0x104:
                    case 0x105:
                    case 0x107:
                    case 0x108:
                    case 0x109:
                    case 0x10a:
                    case 0x10b:
                    case 0x10c:
                    case 0x10d:
                    case 0x10e:
                    case 0x10f:
                    case 0x110:
                    case 0x111:
                    case 0x112:
                    case 0x113:
                    case 0x114:
                    case 0x115:
                    case 0x116:
                    case 0x117:
                    case 0x118:
                    case 0x119:
                    case 0x11a:
                    case 0x11b:
                    case 0x11c:
                    case 0x11d:
                    case 0x11e:
                    case 0x11f:
                    case 0x121:
                    case 0x124:
                    case 0x125:
                    case 0x126:
                    case 0x127:
                    case 0x128:
                    case 0x129:
                    case 0x12a:
                    case 0x12b:
                    case 0x12c:
                    case 0x12d:
                    case 0x12e:
                    case 0x12f:
                    case 0x130:
                    case 0x132:
                    case 0x133:
                    case 0x134:
                    case 0x135:
                    case 0x136:
                    case 0x137:
                    case 0x138:
                    case 0x139:
                    case 0x13a:
                    case 0x13b:
                    case 0x13c:
                    case 0x13d:
                    case 0x13e:
                    case 0x13f:
                    case 0x150:
                    case 0x151:
                    case 0x152:
                    case 0x153:
                    case 0x154:
                    case 0x155:
                    case 0x156:
                    case 0x157:
                    case 0x158:
                    case 0x159:
                    case 0x15a:
                    case 0x15b:
                    case 0x15c:
                    case 0x15d:
                    case 0x15e:
                    case 0x15f:
                    case 0x160:
                    case 0x161:
                    case 0x162:
                    case 0x163:
                    case 0x164:
                    case 0x165:
                    case 0x166:
                    case 0x167:
                    case 0x168:
                    case 0x169:
                    case 0x16a:
                    case 0x16b:
                    case 0x16c:
                    case 0x16d:
                    case 0x16e:
                    case 0x16f:
                    case 0x170:
                    case 0x171:
                    case 0x172:
                    case 0x173:
                    case 0x174:
                    case 0x175:
                    case 0x176:
                    case 0x177:
                    case 0x178:
                    case 0x179:
                    case 0x17a:
                    case 0x17b:
                    case 0x17c:
                    case 0x17d:
                    case 0x17e:
                    case 0x17f:
                    case 0x1a6:
                    case 0x1a7:
                    case 0x1aa:
                    case 0x1ae:
                    case 0x1b7:
                    case 0x1b8:
                    case 0x1b9:
                    case 0x1bf:
                    case 0x1c0:
                    default:
                        Dc(6);
                    }
                    break;
                }
            }
        }
    } while (--Na);
    this.cycle_count += (xa - Na);
    this.eip = (Kb + Lb - Nb);
    this.cc_src = Ba;
    this.cc_dst = Ca;
    this.cc_op = Da;
    this.cc_op2 = Ea;
    this.cc_dst2 = Fa;
    return Oa;
};
CPU_X86.prototype.exec = function (xa) {
    var Bg, Oa, Cg, ya;
    Cg = this.cycle_count + xa;
    Oa = 256;
    ya = null;
    while (this.cycle_count < Cg) {
        try {
            Oa = this.exec_internal(Cg - this.cycle_count, ya);
            if (Oa != 256) break;
            ya = null;
        } catch (Dg) {
            if (Dg.hasOwnProperty("intno")) {
                ya = Dg;
            } else {
                throw Dg;
            }
        }
    }
    return Oa;
};
CPU_X86.prototype.load_binary = function (Eg, ia, Fg) {
    var Gg, za;
    za = this;
    Gg = function (Hg, og) {
        var i;
        if (og < 0) {
            Fg(og);
        } else {
            if (typeof Hg == "string") {
                for (i = 0; i < og; i++) {
                    za.st8_phys(ia + i, Hg.charCodeAt(i));
                }
            } else {
                for (i = 0; i < og; i++) {
                    za.st8_phys(ia + i, Hg[i]);
                }
            }
            Fg(og);
        }
    };
    load_binary(Eg, Gg);
};

function Ig(a) {
    return ((a / 10) << 4) | (a % 10);
}

function Jg(n) {
    var fa, i;
    fa = new Array();
    for (i = 0; i < n; i++) fa[i] = 0;
    return fa;
}

function Kg(Lg) {
    var Mg, d;
    Mg = Jg(128);
    this.cmos_data = Mg;
    this.cmos_index = 0;
    d = new Date();
    Mg[0] = Ig(d.getUTCSeconds());
    Mg[2] = Ig(d.getUTCMinutes());
    Mg[4] = Ig(d.getUTCHours());
    Mg[6] = Ig(d.getUTCDay());
    Mg[7] = Ig(d.getUTCDate());
    Mg[8] = Ig(d.getUTCMonth() + 1);
    Mg[9] = Ig(d.getUTCFullYear() % 100);
    Mg[10] = 0x26;
    Mg[11] = 0x02;
    Mg[12] = 0x00;
    Mg[13] = 0x80;
    Mg[0x14] = 0x02;
    Lg.register_ioport_write(0x70, 2, 1, this.ioport_write.bind(this));
    Lg.register_ioport_read(0x70, 2, 1, this.ioport_read.bind(this));
}
Kg.prototype.ioport_write = function (ia, Hg) {
    if (ia == 0x70) {
        this.cmos_index = Hg & 0x7f;
    }
};
Kg.prototype.ioport_read = function (ia) {
    var Ng;
    if (ia == 0x70) {
        return 0xff;
    } else {
        Ng = this.cmos_data[this.cmos_index];
        if (this.cmos_index == 10) this.cmos_data[10] ^= 0x80;
        else if (this.cmos_index == 12) this.cmos_data[12] = 0x00;
        return Ng;
    }
};

function Og(Lg, Wf) {
    Lg.register_ioport_write(Wf, 2, 1, this.ioport_write.bind(this));
    Lg.register_ioport_read(Wf, 2, 1, this.ioport_read.bind(this));
    this.reset();
}
Og.prototype.reset = function () {
    this.last_irr = 0;
    this.irr = 0;
    this.imr = 0;
    this.isr = 0;
    this.priority_add = 0;
    this.irq_base = 0;
    this.read_reg_select = 0;
    this.special_mask = 0;
    this.init_state = 0;
    this.auto_eoi = 0;
    this.rotate_on_autoeoi = 0;
    this.init4 = 0;
    this.elcr = 0;
    this.elcr_mask = 0;
};
Og.prototype.set_irq1 = function (Pg, Nf) {
    var wc;
    wc = 1 << Pg;
    if (Nf) {
        if ((this.last_irr & wc) == 0) this.irr |= wc;
        this.last_irr |= wc;
    } else {
        this.last_irr &= ~wc;
    }
};
Og.prototype.get_priority = function (wc) {
    var Qg;
    if (wc == 0) return -1;
    Qg = 7;
    while ((wc & (1 << ((Qg + this.priority_add) & 7))) == 0) Qg--;
    return Qg;
};
Og.prototype.get_irq = function () {
    var wc, Rg, Qg;
    wc = this.irr & ~this.imr;
    Qg = this.get_priority(wc);
    if (Qg < 0) return -1;
    Rg = this.get_priority(this.isr);
    if (Qg > Rg) {
        return Qg;
    } else {
        return -1;
    }
};
Og.prototype.intack = function (Pg) {
    if (this.auto_eoi) {
        if (this.rotate_on_auto_eoi) this.priority_add = (Pg + 1) & 7;
    } else {
        this.isr |= (1 << Pg);
    } if (!(this.elcr & (1 << Pg))) this.irr &= ~(1 << Pg);
};
Og.prototype.ioport_write = function (ia, ja) {
    var Qg;
    ia &= 1;
    if (ia == 0) {
        if (ja & 0x10) {
            this.reset();
            this.init_state = 1;
            this.init4 = ja & 1;
            if (ja & 0x02) throw "single mode not supported";
            if (ja & 0x08) throw "level sensitive irq not supported";
        } else if (ja & 0x08) {
            if (ja & 0x02) this.read_reg_select = ja & 1;
            if (ja & 0x40) this.special_mask = (ja >> 5) & 1;
        } else {
            switch (ja) {
            case 0x00:
            case 0x80:
                this.rotate_on_autoeoi = ja >> 7;
                break;
            case 0x20:
            case 0xa0:
                Qg = this.get_priority(this.isr);
                if (Qg >= 0) {
                    this.isr &= ~(1 << ((Qg + this.priority_add) & 7));
                }
                if (ja == 0xa0) this.priority_add = (this.priority_add + 1) & 7;
                break;
            case 0x60:
            case 0x61:
            case 0x62:
            case 0x63:
            case 0x64:
            case 0x65:
            case 0x66:
            case 0x67:
                Qg = ja & 7;
                this.isr &= ~(1 << Qg);
                break;
            case 0xc0:
            case 0xc1:
            case 0xc2:
            case 0xc3:
            case 0xc4:
            case 0xc5:
            case 0xc6:
            case 0xc7:
                this.priority_add = (ja + 1) & 7;
                break;
            case 0xe0:
            case 0xe1:
            case 0xe2:
            case 0xe3:
            case 0xe4:
            case 0xe5:
            case 0xe6:
            case 0xe7:
                Qg = ja & 7;
                this.isr &= ~(1 << Qg);
                this.priority_add = (Qg + 1) & 7;
                break;
            }
        }
    } else {
        switch (this.init_state) {
        case 0:
            this.imr = ja;
            this.update_irq();
            break;
        case 1:
            this.irq_base = ja & 0xf8;
            this.init_state = 2;
            break;
        case 2:
            if (this.init4) {
                this.init_state = 3;
            } else {
                this.init_state = 0;
            }
            break;
        case 3:
            this.auto_eoi = (ja >> 1) & 1;
            this.init_state = 0;
            break;
        }
    }
};
Og.prototype.ioport_read = function (Sg) {
    var ia, Ng;
    ia = Sg & 1;
    if (ia == 0) {
        if (this.read_reg_select) Ng = this.isr;
        else Ng = this.irr;
    } else {
        Ng = this.imr;
    }
    return Ng;
};

function Tg(Lg, Ug, Sg, Vg) {
    this.pics = new Array();
    this.pics[0] = new Og(Lg, Ug);
    this.pics[1] = new Og(Lg, Sg);
    this.pics[0].elcr_mask = 0xf8;
    this.pics[1].elcr_mask = 0xde;
    this.irq_requested = 0;
    this.cpu_set_irq = Vg;
    this.pics[0].update_irq = this.update_irq.bind(this);
    this.pics[1].update_irq = this.update_irq.bind(this);
}
Tg.prototype.update_irq = function () {
    var Wg, Pg;
    Wg = this.pics[1].get_irq();
    if (Wg >= 0) {
        this.pics[0].set_irq1(2, 1);
        this.pics[0].set_irq1(2, 0);
    }
    Pg = this.pics[0].get_irq();
    if (Pg >= 0) {
        this.cpu_set_irq(1);
    } else {
        this.cpu_set_irq(0);
    }
};
Tg.prototype.set_irq = function (Pg, Nf) {
    this.pics[Pg >> 3].set_irq1(Pg & 7, Nf);
    this.update_irq();
};
Tg.prototype.get_hard_intno = function () {
    var Pg, Wg, intno;
    Pg = this.pics[0].get_irq();
    if (Pg >= 0) {
        this.pics[0].intack(Pg);
        if (Pg == 2) {
            Wg = this.pics[1].get_irq();
            if (Wg >= 0) {
                this.pics[1].intack(Wg);
            } else {
                Wg = 7;
            }
            intno = this.pics[1].irq_base + Wg;
            Pg = Wg + 8;
        } else {
            intno = this.pics[0].irq_base + Pg;
        }
    } else {
        Pg = 7;
        intno = this.pics[0].irq_base + Pg;
    }
    this.update_irq();
    return intno;
};

function Xg(Lg, Yg, Zg) {
    var s, i;
    this.pit_channels = new Array();
    for (i = 0; i < 3; i++) {
        s = new ah(Zg);
        this.pit_channels[i] = s;
        s.mode = 3;
        s.gate = (i != 2) >> 0;
        s.pit_load_count(0);
    }
    this.speaker_data_on = 0;
    this.set_irq = Yg;
    Lg.register_ioport_write(0x40, 4, 1, this.ioport_write.bind(this));
    Lg.register_ioport_read(0x40, 3, 1, this.ioport_read.bind(this));
    Lg.register_ioport_read(0x61, 1, 1, this.speaker_ioport_read.bind(this));
    Lg.register_ioport_write(0x61, 1, 1, this.speaker_ioport_write.bind(this));
}

function ah(Zg) {
    this.count = 0;
    this.latched_count = 0;
    this.rw_state = 0;
    this.mode = 0;
    this.bcd = 0;
    this.gate = 0;
    this.count_load_time = 0;
    this.get_ticks = Zg;
    this.pit_time_unit = 1193182 / 2000000;
}
ah.prototype.get_time = function () {
    return Math.floor(this.get_ticks() * this.pit_time_unit);
};
ah.prototype.pit_get_count = function () {
    var d, bh;
    d = this.get_time() - this.count_load_time;
    switch (this.mode) {
    case 0:
    case 1:
    case 4:
    case 5:
        bh = (this.count - d) & 0xffff;
        break;
    default:
        bh = this.count - (d % this.count);
        break;
    }
    return bh;
};
ah.prototype.pit_get_out = function () {
    var d, ch;
    d = this.get_time() - this.count_load_time;
    switch (this.mode) {
        default:
    case 0:
        ch = (d >= this.count) >> 0;
        break;
    case 1:
        ch = (d < this.count) >> 0;
        break;
    case 2:
        if ((d % this.count) == 0 && d != 0) ch = 1;
        else ch = 0;
        break;
    case 3:
        ch = ((d % this.count) < (this.count >> 1)) >> 0;
        break;
    case 4:
    case 5:
        ch = (d == this.count) >> 0;
        break;
    }
    return ch;
};
ah.prototype.get_next_transition_time = function () {
    var d, dh, base, eh;
    d = this.get_time() - this.count_load_time;
    switch (this.mode) {
        default:
    case 0:
    case 1:
        if (d < this.count) dh = this.count;
        else return -1;
        break;
    case 2:
        base = (d / this.count) * this.count;
        if ((d - base) == 0 && d != 0) dh = base + this.count;
        else dh = base + this.count + 1;
        break;
    case 3:
        base = (d / this.count) * this.count;
        eh = ((this.count + 1) >> 1);
        if ((d - base) < eh) dh = base + eh;
        else dh = base + this.count;
        break;
    case 4:
    case 5:
        if (d < this.count) dh = this.count;
        else if (d == this.count) dh = this.count + 1;
        else return -1;
        break;
    }
    dh = this.count_load_time + dh;
    return dh;
};
ah.prototype.pit_load_count = function (ja) {
    if (ja == 0) ja = 0x10000;
    this.count_load_time = this.get_time();
    this.count = ja;
};
Xg.prototype.ioport_write = function (ia, ja) {
    var fh, gh, s;
    ia &= 3;
    if (ia == 3) {
        fh = ja >> 6;
        if (fh == 3) return;
        s = this.pit_channels[fh];
        gh = (ja >> 4) & 3;
        switch (gh) {
        case 0:
            s.latched_count = s.pit_get_count();
            s.rw_state = 4;
            break;
        default:
            s.mode = (ja >> 1) & 7;
            s.bcd = ja & 1;
            s.rw_state = gh - 1 + 0;
            break;
        }
    } else {
        s = this.pit_channels[ia];
        switch (s.rw_state) {
        case 0:
            s.pit_load_count(ja);
            break;
        case 1:
            s.pit_load_count(ja << 8);
            break;
        case 2:
        case 3:
            if (s.rw_state & 1) {
                s.pit_load_count((s.latched_count & 0xff) | (ja << 8));
            } else {
                s.latched_count = ja;
            }
            s.rw_state ^= 1;
            break;
        }
    }
};
Xg.prototype.ioport_read = function (ia) {
    var Ng, pa, s;
    ia &= 3;
    s = this.pit_channels[ia];
    switch (s.rw_state) {
    case 0:
    case 1:
    case 2:
    case 3:
        pa = s.pit_get_count();
        if (s.rw_state & 1) Ng = (pa >> 8) & 0xff;
        else Ng = pa & 0xff; if (s.rw_state & 2) s.rw_state ^= 1;
        break;
    default:
    case 4:
    case 5:
        if (s.rw_state & 1) Ng = s.latched_count >> 8;
        else Ng = s.latched_count & 0xff;
        s.rw_state ^= 1;
        break;
    }
    return Ng;
};
Xg.prototype.speaker_ioport_write = function (ia, ja) {
    this.speaker_data_on = (ja >> 1) & 1;
    this.pit_channels[2].gate = ja & 1;
};
Xg.prototype.speaker_ioport_read = function (ia) {
    var ch, s, ja;
    s = this.pit_channels[2];
    ch = s.pit_get_out();
    ja = (this.speaker_data_on << 1) | s.gate | (ch << 5);
    return ja;
};
Xg.prototype.update_irq = function () {
    this.set_irq(1);
    this.set_irq(0);
};

function hh(Lg, ia, ih, jh) {
    this.divider = 0;
    this.rbr = 0;
    this.ier = 0;
    this.iir = 0x01;
    this.lcr = 0;
    this.mcr = 0;
    this.lsr = 0x40 | 0x20;
    this.msr = 0;
    this.scr = 0;
    this.fcr = 0;
    this.set_irq_func = ih;
    this.write_func = jh;
    this.tx_fifo = "";
    this.rx_fifo = "";
    Lg.register_ioport_write(0x3f8, 8, 1, this.ioport_write.bind(this));
    Lg.register_ioport_read(0x3f8, 8, 1, this.ioport_read.bind(this));
}
hh.prototype.update_irq = function () {
    if ((this.lsr & 0x01) && (this.ier & 0x01)) {
        this.iir = 0x04;
    } else if ((this.lsr & 0x20) && (this.ier & 0x02)) {
        this.iir = 0x02;
    } else {
        this.iir = 0x01;
    } if (this.iir != 0x01) {
        this.set_irq_func(1);
    } else {
        this.set_irq_func(0);
    }
};
hh.prototype.write_tx_fifo = function () {
    if (this.tx_fifo != "") {
        this.write_func(this.tx_fifo);
        this.tx_fifo = "";
        this.lsr |= 0x20;
        this.lsr |= 0x40;
        this.update_irq();
    }
};
hh.prototype.ioport_write = function (ia, ja) {
    ia &= 7;
    switch (ia) {
        default:
    case 0:
        if (this.lcr & 0x80) {
            this.divider = (this.divider & 0xff00) | ja;
        } else {
            if (this.fcr & 0x01) {
                this.tx_fifo += String.fromCharCode(ja);
                this.lsr &= ~0x20;
                this.update_irq();
                if (this.tx_fifo.length >= 16) {
                    this.write_tx_fifo();
                }
            } else {
                this.lsr &= ~0x20;
                this.update_irq();
                this.write_func(String.fromCharCode(ja));
                this.lsr |= 0x20;
                this.lsr |= 0x40;
                this.update_irq();
            }
        }
        break;
    case 1:
        if (this.lcr & 0x80) {
            this.divider = (this.divider & 0x00ff) | (ja << 8);
        } else {
            this.ier = ja;
            this.update_irq();
        }
        break;
    case 2:
        if ((this.fcr ^ ja) & 0x01) {
            ja |= 0x04 | 0x02;
        }
        if (ja & 0x04) this.tx_fifo = "";
        if (ja & 0x02) this.rx_fifo = "";
        this.fcr = ja & 0x01;
        break;
    case 3:
        this.lcr = ja;
        break;
    case 4:
        this.mcr = ja;
        break;
    case 5:
        break;
    case 6:
        this.msr = ja;
        break;
    case 7:
        this.scr = ja;
        break;
    }
};
hh.prototype.ioport_read = function (ia) {
    var Ng;
    ia &= 7;
    switch (ia) {
        default:
    case 0:
        if (this.lcr & 0x80) {
            Ng = this.divider & 0xff;
        } else {
            Ng = this.rbr;
            this.lsr &= ~(0x01 | 0x10);
            this.update_irq();
            this.send_char_from_fifo();
        }
        break;
    case 1:
        if (this.lcr & 0x80) {
            Ng = (this.divider >> 8) & 0xff;
        } else {
            Ng = this.ier;
        }
        break;
    case 2:
        Ng = this.iir;
        if (this.fcr & 0x01) Ng |= 0xC0;
        break;
    case 3:
        Ng = this.lcr;
        break;
    case 4:
        Ng = this.mcr;
        break;
    case 5:
        Ng = this.lsr;
        break;
    case 6:
        Ng = this.msr;
        break;
    case 7:
        Ng = this.scr;
        break;
    }
    return Ng;
};
hh.prototype.send_break = function () {
    this.rbr = 0;
    this.lsr |= 0x10 | 0x01;
    this.update_irq();
};
hh.prototype.send_char = function (kh) {
    this.rbr = kh;
    this.lsr |= 0x01;
    this.update_irq();
};
hh.prototype.send_char_from_fifo = function () {
    var lh;
    lh = this.rx_fifo;
    if (lh != "" && !(this.lsr & 0x01)) {
        this.send_char(lh.charCodeAt(0));
        this.rx_fifo = lh.substr(1, lh.length - 1);
    }
};
hh.prototype.send_chars = function (qa) {
    this.rx_fifo += qa;
    this.send_char_from_fifo();
};

function mh(Lg, nh) {
    Lg.register_ioport_read(0x64, 1, 1, this.read_status.bind(this));
    Lg.register_ioport_write(0x64, 1, 1, this.write_command.bind(this));
    this.reset_request = nh;
}
mh.prototype.read_status = function (ia) {
    return 0;
};
mh.prototype.write_command = function (ia, ja) {
    switch (ja) {
    case 0xfe:
        this.reset_request();
        break;
    default:
        break;
    }
};

function oh(Lg, Wf, ph, jh, qh) {
    Lg.register_ioport_read(Wf, 16, 4, this.ioport_readl.bind(this));
    Lg.register_ioport_write(Wf, 16, 4, this.ioport_writel.bind(this));
    Lg.register_ioport_read(Wf + 8, 1, 1, this.ioport_readb.bind(this));
    Lg.register_ioport_write(Wf + 8, 1, 1, this.ioport_writeb.bind(this));
    this.cur_pos = 0;
    this.doc_str = "";
    this.read_func = ph;
    this.write_func = jh;
    this.get_boot_time = qh;
}
oh.prototype.ioport_writeb = function (ia, ja) {
    this.doc_str += String.fromCharCode(ja);
};
oh.prototype.ioport_readb = function (ia) {
    var c, qa, ja;
    qa = this.doc_str;
    if (this.cur_pos < qa.length) {
        ja = qa.charCodeAt(this.cur_pos) & 0xff;
    } else {
        ja = 0;
    }
    this.cur_pos++;
    return ja;
};
oh.prototype.ioport_writel = function (ia, ja) {
    var qa;
    ia = (ia >> 2) & 3;
    switch (ia) {
    case 0:
        this.doc_str = this.doc_str.substr(0, ja >>> 0);
        break;
    case 1:
        return this.cur_pos = ja >>> 0;
    case 2:
        qa = String.fromCharCode(ja & 0xff) + String.fromCharCode((ja >> 8) & 0xff) + String.fromCharCode((ja >> 16) & 0xff) + String.fromCharCode((ja >> 24) & 0xff);
        this.doc_str += qa;
        break;
    case 3:
        this.write_func(this.doc_str);
    }
};
oh.prototype.ioport_readl = function (ia) {
    var ja;
    ia = (ia >> 2) & 3;
    switch (ia) {
    case 0:
        this.doc_str = this.read_func();
        return this.doc_str.length >> 0;
    case 1:
        return this.cur_pos >> 0;
    case 2:
        ja = this.ioport_readb(0);
        ja |= this.ioport_readb(0) << 8;
        ja |= this.ioport_readb(0) << 16;
        ja |= this.ioport_readb(0) << 24;
        return ja;
    case 3:
        if (this.get_boot_time) return this.get_boot_time() >> 0;
        else return 0;
    }
};
rh.prototype.identify = function () {
    function sh(th, v) {
        fa[th * 2] = v & 0xff;
        fa[th * 2 + 1] = (v >> 8) & 0xff;
    }

    function uh(th, qa, og) {
        var i, v;
        for (i = 0; i < og; i++) {
            if (i < qa.length) {
                v = qa.charCodeAt(i) & 0xff;
            } else {
                v = 32;
            }
            fa[th * 2 + (i ^ 1)] = v;
        }
    }
    var fa, i, vh;
    fa = this.io_buffer;
    for (i = 0; i < 512; i++) fa[i] = 0;
    sh(0, 0x0040);
    sh(1, this.cylinders);
    sh(3, this.heads);
    sh(4, 512 * this.sectors);
    sh(5, 512);
    sh(6, this.sectors);
    sh(20, 3);
    sh(21, 512);
    sh(22, 4);
    uh(27, "JSLinux HARDDISK", 40);
    sh(47, 0x8000 | 128);
    sh(48, 0);
    sh(49, 1 << 9);
    sh(51, 0x200);
    sh(52, 0x200);
    sh(54, this.cylinders);
    sh(55, this.heads);
    sh(56, this.sectors);
    vh = this.cylinders * this.heads * this.sectors;
    sh(57, vh);
    sh(58, vh >> 16);
    if (this.mult_sectors) sh(59, 0x100 | this.mult_sectors);
    sh(60, this.nb_sectors);
    sh(61, this.nb_sectors >> 16);
    sh(80, (1 << 1) | (1 << 2));
    sh(82, (1 << 14));
    sh(83, (1 << 14));
    sh(84, (1 << 14));
    sh(85, (1 << 14));
    sh(86, 0);
    sh(87, (1 << 14));
};
rh.prototype.set_signature = function () {
    this.select &= 0xf0;
    this.nsector = 1;
    this.sector = 1;
    this.lcyl = 0;
    this.hcyl = 0;
};
rh.prototype.abort_command = function () {
    this.status = 0x40 | 0x01;
    this.error = 0x04;
};
rh.prototype.set_irq = function () {
    if (!(this.cmd & 0x02)) {
        this.ide_if.set_irq_func(1);
    }
};
rh.prototype.transfer_start = function (wh, xh) {
    this.end_transfer_func = xh;
    this.data_index = 0;
    this.data_end = wh;
};
rh.prototype.transfer_stop = function () {
    this.end_transfer_func = this.transfer_stop.bind(this);
    this.data_index = 0;
    this.data_end = 0;
};
rh.prototype.get_sector = function () {
    var yh;
    if (this.select & 0x40) {
        yh = ((this.select & 0x0f) << 24) | (this.hcyl << 16) | (this.lcyl << 8) | this.sector;
    } else {
        yh = ((this.hcyl << 8) | this.lcyl) * this.heads * this.sectors + (this.select & 0x0f) * this.sectors + (this.sector - 1);
    }
    return yh;
};
rh.prototype.set_sector = function (yh) {
    var zh, r;
    if (this.select & 0x40) {
        this.select = (this.select & 0xf0) | ((yh >> 24) & 0x0f);
        this.hcyl = (yh >> 16) & 0xff;
        this.lcyl = (yh >> 8) & 0xff;
        this.sector = yh & 0xff;
    } else {
        zh = yh / (this.heads * this.sectors);
        r = yh % (this.heads * this.sectors);
        this.hcyl = (zh >> 8) & 0xff;
        this.lcyl = zh & 0xff;
        this.select = (this.select & 0xf0) | ((r / this.sectors) & 0x0f);
        this.sector = (r % this.sectors) + 1;
    }
};
rh.prototype.sector_read = function () {
    var yh, n, Ng;
    yh = this.get_sector();
    n = this.nsector;
    if (n == 0) n = 256;
    if (n > this.req_nb_sectors) n = this.req_nb_sectors;
    this.io_nb_sectors = n;
    Ng = this.bs.read_async(yh, this.io_buffer, n, this.sector_read_cb.bind(this));
    if (Ng < 0) {
        this.abort_command();
        this.set_irq();
    } else if (Ng == 0) {
        this.sector_read_cb();
    } else {
        this.status = 0x40 | 0x10 | 0x80;
        this.error = 0;
    }
};
rh.prototype.sector_read_cb = function () {
    var n, Ah;
    n = this.io_nb_sectors;
    this.set_sector(this.get_sector() + n);
    this.nsector = (this.nsector - n) & 0xff;
    if (this.nsector == 0) Ah = this.sector_read_cb_end.bind(this);
    else Ah = this.sector_read.bind(this);
    this.transfer_start(512 * n, Ah);
    this.set_irq();
    this.status = 0x40 | 0x10 | 0x08;
    this.error = 0;
};
rh.prototype.sector_read_cb_end = function () {
    this.status = 0x40 | 0x10;
    this.error = 0;
    this.transfer_stop();
};
rh.prototype.sector_write_cb1 = function () {
    var yh, Ng;
    this.transfer_stop();
    yh = this.get_sector();
    Ng = this.bs.write_async(yh, this.io_buffer, this.io_nb_sectors, this.sector_write_cb2.bind(this));
    if (Ng < 0) {
        this.abort_command();
        this.set_irq();
    } else if (Ng == 0) {
        this.sector_write_cb2();
    } else {
        this.status = 0x40 | 0x10 | 0x80;
    }
};
rh.prototype.sector_write_cb2 = function () {
    var n;
    n = this.io_nb_sectors;
    this.set_sector(this.get_sector() + n);
    this.nsector = (this.nsector - n) & 0xff;
    if (this.nsector == 0) {
        this.status = 0x40 | 0x10;
    } else {
        n = this.nsector;
        if (n > this.req_nb_sectors) n = this.req_nb_sectors;
        this.io_nb_sectors = n;
        this.transfer_start(512 * n, this.sector_write_cb1.bind(this));
        this.status = 0x40 | 0x10 | 0x08;
    }
    this.set_irq();
};
rh.prototype.sector_write = function () {
    var n;
    n = this.nsector;
    if (n == 0) n = 256;
    if (n > this.req_nb_sectors) n = this.req_nb_sectors;
    this.io_nb_sectors = n;
    this.transfer_start(512 * n, this.sector_write_cb1.bind(this));
    this.status = 0x40 | 0x10 | 0x08;
};
rh.prototype.identify_cb = function () {
    this.transfer_stop();
    this.status = 0x40;
};
rh.prototype.exec_cmd = function (ja) {
    var n;
    switch (ja) {
    case 0xA1:
    case 0xEC:
        this.identify();
        this.status = 0x40 | 0x10 | 0x08;
        this.transfer_start(512, this.identify_cb.bind(this));
        this.set_irq();
        break;
    case 0x91:
    case 0x10:
        this.error = 0;
        this.status = 0x40 | 0x10;
        this.set_irq();
        break;
    case 0xC6:
        if (this.nsector > 128 || (this.nsector & (this.nsector - 1)) != 0) {
            this.abort_command();
        } else {
            this.mult_sectors = this.nsector;
            this.status = 0x40;
        }
        this.set_irq();
        break;
    case 0x20:
    case 0x21:
        this.req_nb_sectors = 1;
        this.sector_read();
        break;
    case 0x30:
    case 0x31:
        this.req_nb_sectors = 1;
        this.sector_write();
        break;
    case 0xC4:
        if (!this.mult_sectors) {
            this.abort_command();
            this.set_irq();
        } else {
            this.req_nb_sectors = this.mult_sectors;
            this.sector_read();
        }
        break;
    case 0xC5:
        if (!this.mult_sectors) {
            this.abort_command();
            this.set_irq();
        } else {
            this.req_nb_sectors = this.mult_sectors;
            this.sector_write();
        }
        break;
    case 0xF8:
        this.set_sector(this.nb_sectors - 1);
        this.status = 0x40;
        this.set_irq();
        break;
    default:
        this.abort_command();
        this.set_irq();
        break;
    }
};
Bh.prototype.ioport_write = function (ia, ja) {
    var s = this.cur_drive;
    var Ch;
    ia &= 7;
    switch (ia) {
    case 0:
        break;
    case 1:
        if (s) {
            s.feature = ja;
        }
        break;
    case 2:
        if (s) {
            s.nsector = ja;
        }
        break;
    case 3:
        if (s) {
            s.sector = ja;
        }
        break;
    case 4:
        if (s) {
            s.lcyl = ja;
        }
        break;
    case 5:
        if (s) {
            s.hcyl = ja;
        }
        break;
    case 6:
        s = this.cur_drive = this.drives[(ja >> 4) & 1];
        if (s) {
            s.select = ja;
        }
        break;
    default:
    case 7:
        if (s) {
            s.exec_cmd(ja);
        }
        break;
    }
};
Bh.prototype.ioport_read = function (ia) {
    var s = this.cur_drive;
    var Ng;
    ia &= 7;
    if (!s) {
        Ng = 0xff;
    } else {
        switch (ia) {
        case 0:
            Ng = 0xff;
            break;
        case 1:
            Ng = s.error;
            break;
        case 2:
            Ng = s.nsector;
            break;
        case 3:
            Ng = s.sector;
            break;
        case 4:
            Ng = s.lcyl;
            break;
        case 5:
            Ng = s.hcyl;
            break;
        case 6:
            Ng = s.select;
            break;
        default:
        case 7:
            Ng = s.status;
            this.set_irq_func(0);
            break;
        }
    }
    return Ng;
};
Bh.prototype.status_read = function (ia) {
    var s = this.cur_drive;
    var Ng;
    if (s) {
        Ng = s.status;
    } else {
        Ng = 0;
    }
    return Ng;
};
Bh.prototype.cmd_write = function (ia, ja) {
    var i, s;
    if (!(this.cmd & 0x04) && (ja & 0x04)) {
        for (i = 0; i < 2; i++) {
            s = this.drives[i];
            if (s) {
                s.status = 0x80 | 0x10;
                s.error = 0x01;
            }
        }
    } else if ((this.cmd & 0x04) && !(ja & 0x04)) {
        for (i = 0; i < 2; i++) {
            s = this.drives[i];
            if (s) {
                s.status = 0x40 | 0x10;
                s.set_signature();
            }
        }
    }
    for (i = 0; i < 2; i++) {
        s = this.drives[i];
        if (s) {
            s.cmd = ja;
        }
    }
};
Bh.prototype.data_writew = function (ia, ja) {
    var s = this.cur_drive;
    var p, fa;
    if (!s) return;
    p = s.data_index;
    fa = s.io_buffer;
    fa[p] = ja & 0xff;
    fa[p + 1] = (ja >> 8) & 0xff;
    p += 2;
    s.data_index = p;
    if (p >= s.data_end) s.end_transfer_func();
};
Bh.prototype.data_readw = function (ia) {
    var s = this.cur_drive;
    var p, Ng, fa;
    if (!s) {
        Ng = 0;
    } else {
        p = s.data_index;
        fa = s.io_buffer;
        Ng = fa[p] | (fa[p + 1] << 8);
        p += 2;
        s.data_index = p;
        if (p >= s.data_end) s.end_transfer_func();
    }
    return Ng;
};
Bh.prototype.data_writel = function (ia, ja) {
    var s = this.cur_drive;
    var p, fa;
    if (!s) return;
    p = s.data_index;
    fa = s.io_buffer;
    fa[p] = ja & 0xff;
    fa[p + 1] = (ja >> 8) & 0xff;
    fa[p + 2] = (ja >> 16) & 0xff;
    fa[p + 3] = (ja >> 24) & 0xff;
    p += 4;
    s.data_index = p;
    if (p >= s.data_end) s.end_transfer_func();
};
Bh.prototype.data_readl = function (ia) {
    var s = this.cur_drive;
    var p, Ng, fa;
    if (!s) {
        Ng = 0;
    } else {
        p = s.data_index;
        fa = s.io_buffer;
        Ng = fa[p] | (fa[p + 1] << 8) | (fa[p + 2] << 16) | (fa[p + 3] << 24);
        p += 4;
        s.data_index = p;
        if (p >= s.data_end) s.end_transfer_func();
    }
    return Ng;
};

function rh(Dh, Eh) {
    var Fh, Gh;
    this.ide_if = Dh;
    this.bs = Eh;
    Gh = Eh.get_sector_count();
    Fh = Gh / (16 * 63);
    if (Fh > 16383) Fh = 16383;
    else if (Fh < 2) Fh = 2;
    this.cylinders = Fh;
    this.heads = 16;
    this.sectors = 63;
    this.nb_sectors = Gh;
    this.mult_sectors = 128;
    this.feature = 0;
    this.error = 0;
    this.nsector = 0;
    this.sector = 0;
    this.lcyl = 0;
    this.hcyl = 0;
    this.select = 0xa0;
    this.status = 0x40 | 0x10;
    this.cmd = 0;
    this.io_buffer = Jg(128 * 512 + 4);
    this.data_index = 0;
    this.data_end = 0;
    this.end_transfer_func = this.transfer_stop.bind(this);
    this.req_nb_sectors = 0;
    this.io_nb_sectors = 0;
}

function Bh(Lg, ia, Hh, ih, Ih) {
    var i, Jh;
    this.set_irq_func = ih;
    this.drives = [];
    for (i = 0; i < 2; i++) {
        if (Ih[i]) {
            Jh = new rh(this, Ih[i]);
        } else {
            Jh = null;
        }
        this.drives[i] = Jh;
    }
    this.cur_drive = this.drives[0];
    Lg.register_ioport_write(ia, 8, 1, this.ioport_write.bind(this));
    Lg.register_ioport_read(ia, 8, 1, this.ioport_read.bind(this));
    if (Hh) {
        Lg.register_ioport_read(Hh, 1, 1, this.status_read.bind(this));
        Lg.register_ioport_write(Hh, 1, 1, this.cmd_write.bind(this));
    }
    Lg.register_ioport_write(ia, 2, 2, this.data_writew.bind(this));
    Lg.register_ioport_read(ia, 2, 2, this.data_readw.bind(this));
    Lg.register_ioport_write(ia, 4, 4, this.data_writel.bind(this));
    Lg.register_ioport_read(ia, 4, 4, this.data_readl.bind(this));
}

function Kh(Eg, Lh, Mh) {
    if (Eg.indexOf("%d") < 0) throw "Invalid URL";
    if (Mh <= 0 || Lh <= 0) throw "Invalid parameters";
    this.block_sectors = Lh * 2;
    this.nb_sectors = this.block_sectors * Mh;
    this.url = Eg;
    this.max_cache_size = Math.max(1, Math.ceil(2536 / Lh));
    this.cache = new Array();
    this.sector_num = 0;
    this.sector_index = 0;
    this.sector_count = 0;
    this.sector_buf = null;
    this.sector_cb = null;
}
Kh.prototype.get_sector_count = function () {
    return this.nb_sectors;
};
Kh.prototype.get_time = function () {
    return +new Date();
};
Kh.prototype.get_cached_block = function (Nh) {
    var Oh, i, Ph = this.cache;
    for (i = 0; i < Ph.length; i++) {
        Oh = Ph[i];
        if (Oh.block_num == Nh) return Oh;
    }
    return null;
};
Kh.prototype.new_cached_block = function (Nh) {
    var Oh, Qh, i, j, Rh, Ph = this.cache;
    Oh = new Object();
    Oh.block_num = Nh;
    Oh.time = this.get_time();
    if (Ph.length < this.max_cache_size) {
        j = Ph.length;
    } else {
        for (i = 0; i < Ph.length; i++) {
            Qh = Ph[i];
            if (i == 0 || Qh.time < Rh) {
                Rh = Qh.time;
                j = i;
            }
        }
    }
    Ph[j] = Oh;
    return Oh;
};
Kh.prototype.get_url = function (Eg, Nh) {
    var p, s;
    s = Nh.toString();
    while (s.length < 9) s = "0" + s;
    p = Eg.indexOf("%d");
    return Eg.substr(0, p) + s + Eg.substring(p + 2, Eg.length);
};
Kh.prototype.read_async_cb = function (Sh) {
    var Nh, l, ve, Oh, i, Th, Uh, Vh, Wh;
    var Xh, Eg;
    while (this.sector_index < this.sector_count) {
        Nh = Math.floor(this.sector_num / this.block_sectors);
        Oh = this.get_cached_block(Nh);
        if (Oh) {
            ve = this.sector_num - Nh * this.block_sectors;
            l = Math.min(this.sector_count - this.sector_index, this.block_sectors - ve);
            Th = l * 512;
            Uh = this.sector_buf;
            Vh = this.sector_index * 512;
            Wh = Oh.buf;
            Xh = ve * 512;
            for (i = 0; i < Th; i++) {
                Uh[i + Vh] = Wh[i + Xh];
            }
            this.sector_index += l;
            this.sector_num += l;
        } else {
            Eg = this.get_url(this.url, Nh);
            load_binary(Eg, this.read_async_cb2.bind(this));
            return;
        }
    }
    this.sector_buf = null;
    if (!Sh) {
        this.sector_cb(0);
    }
};
Kh.prototype.add_block = function (Nh, Hg, og) {
    var Oh, Yh, i;
    Oh = this.new_cached_block(Nh);
    Yh = Oh.buf = Jg(this.block_sectors * 512);
    if (typeof Hg == "string") {
        for (i = 0; i < og; i++) Yh[i] = Hg.charCodeAt(i) & 0xff;
    } else {
        for (i = 0; i < og; i++) Yh[i] = Hg[i];
    }
};
Kh.prototype.read_async_cb2 = function (Hg, og) {
    var Nh;
    if (og < 0 || og != (this.block_sectors * 512)) {
        this.sector_cb(-1);
    } else {
        Nh = Math.floor(this.sector_num / this.block_sectors);
        this.add_block(Nh, Hg, og);
        this.read_async_cb(false);
    }
};
Kh.prototype.read_async = function (yh, Yh, n, Zh) {
    if ((yh + n) > this.nb_sectors) return -1;
    this.sector_num = yh;
    this.sector_buf = Yh;
    this.sector_index = 0;
    this.sector_count = n;
    this.sector_cb = Zh;
    this.read_async_cb(true);
    if (this.sector_index >= this.sector_count) {
        return 0;
    } else {
        return 1;
    }
};
Kh.prototype.preload = function (fa, Fg) {
    var i, Eg, Nh;
    if (fa.length == 0) {
        setTimeout(Fg, 0);
    } else {
        this.preload_cb2 = Fg;
        this.preload_count = fa.length;
        for (i = 0; i < fa.length; i++) {
            Nh = fa[i];
            Eg = this.get_url(this.url, Nh);
            load_binary(Eg, this.preload_cb.bind(this, Nh));
        }
    }
};
Kh.prototype.preload_cb = function (Nh, Hg, og) {
    if (og < 0) {} else {
        this.add_block(Nh, Hg, og);
        this.preload_count--;
        if (this.preload_count == 0) {
            this.preload_cb2(0);
        }
    }
};
Kh.prototype.write_async = function (yh, Yh, n, Zh) {
    return -1;
};
ai.prototype.reset = function () {
    this.isr = 0x80;
};
ai.prototype.update_irq = function () {
    var bi;
    bi = (this.isr & this.imr) & 0x7f;
    if (bi) this.set_irq_func(1);
    else this.set_irq_func(0);
};
ai.prototype.compute_mcast_idx = function (ci) {
    var di, bc, i, j, b;
    di = -1;
    for (i = 0; i < 6; i++) {
        b = ci[i];
        for (j = 0; j < 8; j++) {
            bc = (di >>> 31) ^ (b & 0x01);
            di <<= 1;
            b >>= 1;
            if (bc) di = (di ^ 0x04c11db6) | bc;
        }
    }
    return di >>> 26;
};
ai.prototype.buffer_full = function () {
    var ei, Sb, fi;
    Sb = this.curpag << 8;
    fi = this.boundary << 8;
    if (Sb < fi) ei = fi - Sb;
    else ei = (this.stop - this.start) - (Sb - fi);
    return (ei < (1514 + 4));
};
ai.prototype.receive_packet = function (Yh) {
    var gi, hi, og, Sb, ii, wh, ji, ia;
    var ki, i;
    wh = Yh.length;
    if (this.cmd & 0x01 || this.buffer_full() || wh < 6) return;
    if (this.rxcr & 0x10) {} else {
        if (Yh[0] == 0xff && Yh[1] == 0xff && Yh[2] == 0xff && Yh[3] == 0xff && Yh[4] == 0xff && Yh[5] == 0xff) {
            if (!(this.rxcr & 0x04)) return;
        } else if (Yh[0] & 0x01) {
            if (!(this.rxcr & 0x08)) return;
            ii = li(Yh);
            if (!(this.mult[ii >> 3] & (1 << (ii & 7)))) return;
        } else if (this.phys[0] == Yh[0] && this.phys[1] == Yh[1] && this.phys[2] == Yh[2] && this.phys[3] == Yh[3] && this.phys[4] == Yh[4] && this.phys[5] == Yh[5]) {} else {
            return;
        }
    } if (wh < 60) wh = 60;
    Sb = this.curpag << 8;
    ji = this.mem;
    gi = wh + 4;
    hi = Sb + ((gi + 4 + 255) & ~0xff);
    if (hi >= this.stop) hi -= (this.stop - this.start);
    this.rsr = 0x01;
    if (Yh[0] & 0x01) this.rsr |= 0x20;
    ia = Sb & 0x7fff;
    if (ia >= 0x4000) {
        ji[ia] = this.rsr & 0xff;
        ji[ia + 1] = (hi >> 8) & 0xff;
        ji[ia + 2] = gi & 0xff;
        ji[ia + 3] = (gi >> 8) & 0xff;
    }
    Sb += 4;
    while (wh > 0) {
        if (Sb >= this.stop) break;
        og = Math.min(wh, this.stop - Sb);
        if (ki < Yh.length) og = Math.min(og, Yh.length - ki);
        og = Math.min(og, 0x4000 - (Sb & 0x3fff));
        ia = Sb & 0x7fff;
        if (ia >= 0x4000) {
            if (ki < Yh.length) {
                for (i = 0; i < og; i++) ji[ia + i] = Yh[ki + i];
            } else {
                for (i = 0; i < og; i++) ji[ia + i] = 0;
            }
        }
        ki += og;
        Sb += og;
        if (Sb == this.stop) Sb = this.start;
        wh -= og;
    }
    this.curpag = hi >> 8;
    this.isr |= 0x01;
    this.update_irq();
};
ai.prototype.send_packet = function () {
    var Sb;
    Sb = (this.tpsr << 8) & 0x7fff;
    if (Sb + this.tcnt <= (32 * 1024)) {
        this.send_packet_func(this.mem, Sb, this.tcnt);
    }
    this.tsr = 0x01;
    this.isr |= 0x02;
    this.cmd &= ~0x04;
    this.update_irq();
};
ai.prototype.ioport_write = function (ia, ja) {
    var ve, mi;
    ia &= 0xf;
    if (ia == 0x00) {
        this.cmd = ja;
        if (!(ja & 0x01)) {
            this.isr &= ~0x80;
            if ((ja & (0x08 | 0x10)) && this.rcnt == 0) {
                this.isr |= 0x40;
                this.update_irq();
            }
            if (ja & 0x04) {
                this.send_packet();
            }
        }
    } else {
        mi = this.cmd >> 6;
        ve = ia | (mi << 4);
        switch (ve) {
        case 0x01:
            this.start = ja << 8;
            break;
        case 0x02:
            this.stop = ja << 8;
            break;
        case 0x03:
            this.boundary = ja;
            break;
        case 0x0f:
            this.imr = ja;
            this.update_irq();
            break;
        case 0x04:
            this.tpsr = ja;
            break;
        case 0x05:
            this.tcnt = (this.tcnt & 0xff00) | ja;
            break;
        case 0x06:
            this.tcnt = (this.tcnt & 0x00ff) | (ja << 8);
            break;
        case 0x08:
            this.rsar = (this.rsar & 0xff00) | ja;
            break;
        case 0x09:
            this.rsar = (this.rsar & 0x00ff) | (ja << 8);
            break;
        case 0x0a:
            this.rcnt = (this.rcnt & 0xff00) | ja;
            break;
        case 0x0b:
            this.rcnt = (this.rcnt & 0x00ff) | (ja << 8);
            break;
        case 0x0c:
            this.rxcr = ja;
            break;
        case 0x0e:
            this.dcfg = ja;
            break;
        case 0x07:
            this.isr &= ~(ja & 0x7f);
            this.update_irq();
            break;
        case 0x11:
        case 0x11 + 1:
        case 0x11 + 2:
        case 0x11 + 3:
        case 0x11 + 4:
        case 0x11 + 5:
            this.phys[ve - 0x11] = ja;
            break;
        case 0x17:
            this.curpag = ja;
            break;
        case 0x18:
        case 0x18 + 1:
        case 0x18 + 2:
        case 0x18 + 3:
        case 0x18 + 4:
        case 0x18 + 5:
        case 0x18 + 6:
        case 0x18 + 7:
            this.mult[ve - 0x18] = ja;
            break;
        }
    }
};
ai.prototype.ioport_read = function (ia) {
    var ve, mi, Ng;
    ia &= 0xf;
    if (ia == 0x00) {
        Ng = this.cmd;
    } else {
        mi = this.cmd >> 6;
        ve = ia | (mi << 4);
        switch (ve) {
        case 0x04:
            Ng = this.tsr;
            break;
        case 0x03:
            Ng = this.boundary;
            break;
        case 0x07:
            Ng = this.isr;
            break;
        case 0x08:
            Ng = this.rsar & 0x00ff;
            break;
        case 0x09:
            Ng = this.rsar >> 8;
            break;
        case 0x11:
        case 0x11 + 1:
        case 0x11 + 2:
        case 0x11 + 3:
        case 0x11 + 4:
        case 0x11 + 5:
            Ng = this.phys[ve - 0x11];
            break;
        case 0x17:
            Ng = this.curpag;
            break;
        case 0x18:
        case 0x18 + 1:
        case 0x18 + 2:
        case 0x18 + 3:
        case 0x18 + 4:
        case 0x18 + 5:
        case 0x18 + 6:
        case 0x18 + 7:
            Ng = this.mult[ve - 0x18];
            break;
        case 0x0c:
            Ng = this.rsr;
            break;
        case 0x21:
            Ng = this.start >> 8;
            break;
        case 0x22:
            Ng = this.stop >> 8;
            break;
        case 0x0a:
            Ng = 0x50;
            break;
        case 0x0b:
            Ng = 0x43;
            break;
        case 0x33:
            Ng = 0;
            break;
        case 0x35:
            Ng = 0x40;
            break;
        case 0x36:
            Ng = 0x40;
            break;
        default:
            Ng = 0x00;
            break;
        }
    }
    return Ng;
};
ai.prototype.dma_update = function (og) {
    this.rsar += og;
    if (this.rsar == this.stop) this.rsar = this.start;
    if (this.rcnt <= og) {
        this.rcnt = 0;
        this.isr |= 0x40;
        this.update_irq();
    } else {
        this.rcnt -= og;
    }
};
ai.prototype.asic_ioport_write = function (ia, ja) {
    var ia;
    if (this.rcnt == 0) return;
    if (this.dcfg & 0x01) {
        ia = (this.rsar & ~1) & 0x7fff;
        if (ia >= 0x4000) {
            this.mem[ia] = ja & 0xff;
            this.mem[ia + 1] = (ja >> 8) & 0xff;
        }
        this.dma_update(2);
    } else {
        ia = this.rsar & 0x7fff;
        if (ia >= 0x4000) {
            this.mem[ia] = ja & 0xff;
        }
        this.dma_update(1);
    }
};
ai.prototype.asic_ioport_read = function (ia) {
    var ia, Ng;
    if (this.dcfg & 0x01) {
        ia = (this.rsar & ~1) & 0x7fff;
        Ng = this.mem[ia] | (this.mem[ia + 1] << 8);
        this.dma_update(2);
    } else {
        ia = this.rsar & 0x7fff;
        Ng = this.mem[ia];
        this.dma_update(1);
    }
    return Ng;
};
ai.prototype.asic_ioport_writel = function (ia, ja) {
    var ia;
    if (this.rcnt == 0) return;
    ia = (this.rsar & ~1) & 0x7fff;
    if (ia >= 0x4000) {
        this.mem[ia] = ja & 0xff;
        this.mem[ia + 1] = (ja >> 8) & 0xff;
    }
    ia = (ia + 2) & 0x7fff;
    if (ia >= 0x4000) {
        this.mem[ia] = (ja >> 16) & 0xff;
        this.mem[ia + 1] = (ja >> 24) & 0xff;
    }
    this.dma_update(4);
};
ai.prototype.asic_ioport_readl = function (ia) {
    var ia, Ng;
    ia = (this.rsar & ~1) & 0x7fff;
    Ng = this.mem[ia] | (this.mem[ia + 1] << 8);
    ia = (ia + 2) & 0x7fff;
    Ng |= (this.mem[ia] << 16) | (this.mem[ia + 1] << 24);
    this.dma_update(4);
    return Ng;
};
ai.prototype.reset_ioport_write = function (ia, ja) {};
ai.prototype.reset_ioport_read = function (ia) {
    this.reset();
};

function ai(Lg, base, ih, ni, oi) {
    var i;
    this.set_irq_func = ih;
    this.send_packet_func = oi;
    Lg.register_ioport_write(base, 16, 1, this.ioport_write.bind(this));
    Lg.register_ioport_read(base, 16, 1, this.ioport_read.bind(this));
    Lg.register_ioport_write(base + 0x10, 1, 1, this.asic_ioport_write.bind(this));
    Lg.register_ioport_read(base + 0x10, 1, 1, this.asic_ioport_read.bind(this));
    Lg.register_ioport_write(base + 0x10, 2, 2, this.asic_ioport_write.bind(this));
    Lg.register_ioport_read(base + 0x10, 2, 2, this.asic_ioport_read.bind(this));
    Lg.register_ioport_write(base + 0x1f, 1, 1, this.reset_ioport_write.bind(this));
    Lg.register_ioport_read(base + 0x1f, 1, 1, this.reset_ioport_read.bind(this));
    this.cmd = 0;
    this.start = 0;
    this.stop = 0;
    this.boundary = 0;
    this.tsr = 0;
    this.tpsr = 0;
    this.tcnt = 0;
    this.rcnt = 0;
    this.rsar = 0;
    this.rsr = 0;
    this.rxcr = 0;
    this.isr = 0;
    this.dcfg = 0;
    this.imr = 0;
    this.phys = Jg(6);
    this.curpag = 0;
    this.mult = Jg(8);
    this.mem = Jg((32 * 1024));
    for (i = 0; i < 6; i++) this.mem[i] = ni[i];
    this.mem[14] = 0x57;
    this.mem[15] = 0x57;
    for (i = 15; i >= 0; i--) {
        this.mem[2 * i] = this.mem[i];
        this.mem[2 * i + 1] = this.mem[i];
    }
    this.reset();
}

function pi(Yh, Sb, og) {
    console.log("send packet len=" + og);
}

function Vg(Nf) {
    this.hard_irq = Nf;
}

function qi() {
    return this.cycle_count;
}

function PCEmulator(ri) {
    var za, si, ti, i, p;
    za = new CPU_X86();
    this.cpu = za;
    za.phys_mem_resize(ri.mem_size);
    this.init_ioports();
    this.register_ioport_write(0x80, 1, 1, this.ioport80_write);
    this.pic = new Tg(this, 0x20, 0xa0, Vg.bind(za));
    this.pit = new Xg(this, this.pic.set_irq.bind(this.pic, 0), qi.bind(za));
    this.cmos = new Kg(this);
    this.serial = new hh(this, 0x3f8, this.pic.set_irq.bind(this.pic, 4), ri.serial_write);
    this.kbd = new mh(this, this.reset.bind(this));
    this.reset_request = 0;
    ti = ["hda", "hdb"];
    si = new Array();
    for (i = 0; i < ti.length; i++) {
        p = ri[ti[i]];
        si[i] = null;
        if (p) {
            si[i] = new Kh(p.url, p.block_size, p.nb_blocks);
        }
    }
    this.ide0 = new Bh(this, 0x1f0, 0x3f6, this.pic.set_irq.bind(this.pic, 14), si);
    this.net0 = new ai(this, 0x300, this.pic.set_irq.bind(this.pic, 9), [0xaa, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa], pi);
    if (ri.clipboard_get && ri.clipboard_set) {
        this.jsclipboard = new oh(this, 0x3c0, ri.clipboard_get, ri.clipboard_set, ri.get_boot_time);
    }
    za.ld8_port = this.ld8_port.bind(this);
    za.ld16_port = this.ld16_port.bind(this);
    za.ld32_port = this.ld32_port.bind(this);
    za.st8_port = this.st8_port.bind(this);
    za.st16_port = this.st16_port.bind(this);
    za.st32_port = this.st32_port.bind(this);
    za.get_hard_intno = this.pic.get_hard_intno.bind(this.pic);
}
PCEmulator.prototype.load_binary = function (Eg, ka, Fg) {
    return this.cpu.load_binary(Eg, ka, Fg);
};
PCEmulator.prototype.start = function () {
    setTimeout(this.timer_func.bind(this), 10);
};
PCEmulator.prototype.timer_func = function () {
    var Oa, ui, vi, wi, xi, Lg, za;
    Lg = this;
    za = Lg.cpu;
    vi = za.cycle_count + 100000;
    wi = false;
    xi = false;
    yi: while (za.cycle_count < vi) {
        Lg.serial.write_tx_fifo();
        Lg.pit.update_irq();
        Oa = za.exec(vi - za.cycle_count);
        if (Oa == 256) {
            if (Lg.reset_request) {
                wi = true;
                break;
            }
        } else if (Oa == 257) {
            xi = true;
            break;
        } else {
            wi = true;
            break;
        }
    }
    if (!wi) {
        if (xi) {
            setTimeout(this.timer_func.bind(this), 10);
        } else {
            setTimeout(this.timer_func.bind(this), 0);
        }
    }
};
PCEmulator.prototype.init_ioports = function () {
    var i, zi, Ai;
    this.ioport_readb_table = new Array();
    this.ioport_writeb_table = new Array();
    this.ioport_readw_table = new Array();
    this.ioport_writew_table = new Array();
    this.ioport_readl_table = new Array();
    this.ioport_writel_table = new Array();
    zi = this.default_ioport_readw.bind(this);
    Ai = this.default_ioport_writew.bind(this);
    for (i = 0; i < 1024; i++) {
        this.ioport_readb_table[i] = this.default_ioport_readb;
        this.ioport_writeb_table[i] = this.default_ioport_writeb;
        this.ioport_readw_table[i] = zi;
        this.ioport_writew_table[i] = Ai;
        this.ioport_readl_table[i] = this.default_ioport_readl;
        this.ioport_writel_table[i] = this.default_ioport_writel;
    }
};
PCEmulator.prototype.default_ioport_readb = function (Wf) {
    var ja;
    ja = 0xff;
    return ja;
};
PCEmulator.prototype.default_ioport_readw = function (Wf) {
    var ja;
    ja = this.ioport_readb_table[Wf](Wf);
    Wf = (Wf + 1) & (1024 - 1);
    ja |= this.ioport_readb_table[Wf](Wf) << 8;
    return ja;
};
PCEmulator.prototype.default_ioport_readl = function (Wf) {
    var ja;
    ja = -1;
    return ja;
};
PCEmulator.prototype.default_ioport_writeb = function (Wf, ja) {};
PCEmulator.prototype.default_ioport_writew = function (Wf, ja) {
    this.ioport_writeb_table[Wf](Wf, ja & 0xff);
    Wf = (Wf + 1) & (1024 - 1);
    this.ioport_writeb_table[Wf](Wf, (ja >> 8) & 0xff);
};
PCEmulator.prototype.default_ioport_writel = function (Wf, ja) {};
PCEmulator.prototype.ld8_port = function (Wf) {
    var ja;
    ja = this.ioport_readb_table[Wf & (1024 - 1)](Wf);
    return ja;
};
PCEmulator.prototype.ld16_port = function (Wf) {
    var ja;
    ja = this.ioport_readw_table[Wf & (1024 - 1)](Wf);
    return ja;
};
PCEmulator.prototype.ld32_port = function (Wf) {
    var ja;
    ja = this.ioport_readl_table[Wf & (1024 - 1)](Wf);
    return ja;
};
PCEmulator.prototype.st8_port = function (Wf, ja) {
    this.ioport_writeb_table[Wf & (1024 - 1)](Wf, ja);
};
PCEmulator.prototype.st16_port = function (Wf, ja) {
    this.ioport_writew_table[Wf & (1024 - 1)](Wf, ja);
};
PCEmulator.prototype.st32_port = function (Wf, ja) {
    this.ioport_writel_table[Wf & (1024 - 1)](Wf, ja);
};
PCEmulator.prototype.register_ioport_read = function (start, og, wh, Ah) {
    var i;
    switch (wh) {
    case 1:
        for (i = start; i < start + og; i++) {
            this.ioport_readb_table[i] = Ah;
        }
        break;
    case 2:
        for (i = start; i < start + og; i += 2) {
            this.ioport_readw_table[i] = Ah;
        }
        break;
    case 4:
        for (i = start; i < start + og; i += 4) {
            this.ioport_readl_table[i] = Ah;
        }
        break;
    }
};
PCEmulator.prototype.register_ioport_write = function (start, og, wh, Ah) {
    var i;
    switch (wh) {
    case 1:
        for (i = start; i < start + og; i++) {
            this.ioport_writeb_table[i] = Ah;
        }
        break;
    case 2:
        for (i = start; i < start + og; i += 2) {
            this.ioport_writew_table[i] = Ah;
        }
        break;
    case 4:
        for (i = start; i < start + og; i += 4) {
            this.ioport_writel_table[i] = Ah;
        }
        break;
    }
};
PCEmulator.prototype.ioport80_write = function (ia, Hg) {};
PCEmulator.prototype.reset = function () {
    this.reset_request = 1;
};