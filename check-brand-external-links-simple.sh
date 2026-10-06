#!/bin/bash
# Quick check for external links in brand schema/notes for new brands
echo "Checking for external links in brand content..."

for brand in abitron abj abk abko abl abl-sursum abloy abm abo aboni \
    aventics balluff baumer beckhoff bernstein carlo-gavazzi cognex \
    control-techniques datalogic di-soric ebm-papst euchner festo gefran \
    grundfos honeywell ifm imi-norgren ipf keyence lenze leuze mac \
    metal-work-pneumatic micro-detectors mitsubishi-electric omron panasonic \
    parker pepperl-plus-fuchs phoenix-contact pilz pizzato rexroth \
    bosch-rexroth schmersal schneider-electric sew-eurodrive sick siko \
    turck wenglor wika yaskawa; do
    
    if grep -q "\"url\":" brand-content.json | grep -A 5 "\"$brand\""; then
        echo "⚠ WARNING: Found url field in $brand"
        exit 1
    fi
    
    if grep -q "\"sameAs\":" brand-content.json | grep -A 5 "\"$brand\""; then
        echo "⚠ WARNING: Found sameAs field in $brand"
        exit 1
    fi
    
    if grep -q "href=\"http" brand-content.json | grep -A 5 "\"$brand\""; then
        echo "⚠ WARNING: Found external http link in $brand"
        exit 1
    fi
done

echo "✓ No external links found in new brand entries"
