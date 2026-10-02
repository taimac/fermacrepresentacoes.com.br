/**
 * Calculadora de peso teórico (/tecnico/calculadora-peso.html)
 *
 * Pure calculation module: no DOM, no state. The page controller in
 * siteController.js calls it in the browser (window.TecnicoPeso), and
 * tests/tecnicoPeso.test.js calls it under `node --test` (require).
 *
 * Weight = volume × density. Measures come in millimetres; dividing by
 * 100 gives decimetres, so the volume is in dm³ and, at 7,85 kg/dm³
 * (carbon steel), the weight is in kg. 7,85 is the only density here.
 */
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.TecnicoPeso = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    const DENSITY = 7.85; // kg/dm³, carbon steel

    // A conservative technical ceiling: no single measure of a flat steel
    // product reaches 100 m. Anything above it is a typing slip.
    const MAX_MEASURE_MM = 100000;

    const CHECK_MEASURES = 'Confira as medidas.';

    const MM_PER_DM = 100;

    // Thickness × width × length, all in mm → dm³.
    function plateVolume(thickness, width, length) {
        return (thickness / MM_PER_DM) * (width / MM_PER_DM) * (length / MM_PER_DM);
    }

    // π/4 · (Øe² − Øi²) · width, all in mm → dm³: the annulus area times the width.
    function coilVolume(innerDiameter, outerDiameter, width) {
        const di = innerDiameter / MM_PER_DM;
        const de = outerDiameter / MM_PER_DM;
        return (Math.PI / 4) * (de * de - di * di) * (width / MM_PER_DM);
    }

    function weight(volume) {
        return volume * DENSITY;
    }

    // chapa: e × l × c
    function chapa(espessura, largura, comprimento) {
        return weight(plateVolume(espessura, largura, comprimento));
    }

    // bobina: π/4 · (Øe² − Øi²) · largura
    function bobina(diametroInterno, diametroExterno, largura) {
        return weight(coilVolume(diametroInterno, diametroExterno, largura));
    }

    // tira cut to length: the same as a chapa of the same size
    function tira(espessura, largura, comprimento) {
        return chapa(espessura, largura, comprimento);
    }

    // tira as a coil (rolo): the same as a bobina of the same size
    function tiraRolo(diametroInterno, diametroExterno, largura) {
        return bobina(diametroInterno, diametroExterno, largura);
    }

    /*
     * pt-BR number input. The comma is the decimal mark ("6,30"); dots are
     * thousands separators when they group by three after a non-zero
     * digit ("1.200", "1.200,5"). Any other dot is read as a decimal mark
     * ("6.30", "0.5", "0.500"), because that is what a buyer typing a
     * thickness means. With options.dotIsDecimal (the thickness field) a
     * lone dot is always a decimal mark, so "1.250" is 1,25 mm: no flat
     * product is 1.250 mm thick. Spaces are ignored. A trailing comma or
     * dot is ignored ("6," → 6), so a field is not flagged while the user
     * is still typing "6,30". A leading minus is read, so the caller can
     * say "maior que zero" rather than "use só números". Returns a number,
     * or NaN for anything else.
     */
    function parseNumber(text, options) {
        if (typeof text !== 'string') return NaN;
        let value = text.replace(/\s+/g, '');
        const sign = value.startsWith('-') ? -1 : 1;
        if (sign < 0) value = value.slice(1);
        value = value.replace(/^(\d[\d.,]*)[,.]$/, '$1');
        if (!value) return NaN;
        const dotIsDecimal = Boolean(options && options.dotIsDecimal);
        let normal;
        if (dotIsDecimal && /^\d+\.\d+$/.test(value)) {
            normal = value;
        } else if (/^[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(value)) {
            normal = value.replace(/\./g, '').replace(',', '.');
        } else if (/^\d+(,\d+)?$/.test(value) || /^,\d+$/.test(value)) {
            normal = value.replace(',', '.');
        } else if (/^\d*\.\d+$/.test(value) || /^\d+$/.test(value)) {
            normal = value;
        } else {
            return NaN;
        }
        const number = sign * Number(normal);
        return Number.isFinite(number) ? number : NaN;
    }

    const FORMAT_DECIMALS = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    // 178.0380 → "178,04 kg"; 1335.4 → "1.335,40 kg"
    function formatKg(kg) {
        return FORMAT_DECIMALS.format(kg) + ' kg';
    }

    // Measures echoed back as read, without thousands dots, so a dotted
    // input read as thousands shows plainly: "25.400" → "25400";
    // 6.3 with two minimum decimals (a thickness) → "6,30".
    function formatMeasure(mm, minimumFractionDigits) {
        const min = minimumFractionDigits || 0;
        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: min,
            maximumFractionDigits: Math.max(min, 3),
            useGrouping: false,
        }).format(mm);
    }

    /*
     * The fields each shape needs, in the order the page asks for them.
     * Field keys match the inputs' data-field attributes on the page.
     */
    const SHAPES = {
        chapa: { fields: ['espessura', 'largura', 'comprimento'], form: 'plate' },
        bobina: { fields: ['diametroInterno', 'diametroExterno', 'largura'], form: 'coil' },
        'tira-comprimento': { fields: ['espessura', 'largura', 'comprimento'], form: 'plate' },
        'tira-rolo': { fields: ['diametroInterno', 'diametroExterno', 'largura'], form: 'coil' },
    };

    /*
     * Validate raw text inputs for one shape and compute its weight.
     * Returns { ok: true, kg, values } or { ok: false, errors } where errors
     * maps a field key to a short message in Portuguese.
     */
    function calculate(shape, raw) {
        const spec = SHAPES[shape];
        if (!spec) throw new Error('Unknown shape: ' + shape);
        const values = {};
        const errors = {};
        spec.fields.forEach(field => {
            const text = raw && typeof raw[field] === 'string' ? raw[field].trim() : '';
            if (!text) {
                errors[field] = 'Informe a medida em milímetros.';
                return;
            }
            const number = parseNumber(text, { dotIsDecimal: field === 'espessura' });
            if (Number.isNaN(number)) {
                errors[field] = 'Use só números, com vírgula para decimais (ex.: 6,30).';
            } else if (!(number > 0)) {
                errors[field] = 'A medida precisa ser maior que zero.';
            } else if (number > MAX_MEASURE_MM) {
                errors[field] = CHECK_MEASURES;
            } else {
                values[field] = number;
            }
        });
        if (spec.form === 'coil'
            && !errors.diametroInterno && !errors.diametroExterno
            && !(values.diametroExterno > values.diametroInterno)) {
            errors.diametroExterno = 'O diâmetro externo precisa ser maior que o interno.';
        }
        if (Object.keys(errors).length) return { ok: false, errors };

        const kg = spec.form === 'plate'
            ? chapa(values.espessura, values.largura, values.comprimento)
            : bobina(values.diametroInterno, values.diametroExterno, values.largura);
        if (!Number.isFinite(kg)) return { ok: false, errors: { [spec.fields[0]]: CHECK_MEASURES } };
        return { ok: true, kg, values };
    }

    return {
        DENSITY,
        MAX_MEASURE_MM,
        SHAPES,
        plateVolume,
        coilVolume,
        chapa,
        bobina,
        tira,
        tiraRolo,
        parseNumber,
        formatKg,
        formatMeasure,
        calculate,
    };
}));
