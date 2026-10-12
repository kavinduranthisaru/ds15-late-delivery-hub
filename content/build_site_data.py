"""Build site_data.json, the single source of every number and sentence the app shows.

Sources
- Model_Comparison_Summary.docx (theory, ladder, reasons) - parsed below, from DS15_SOURCES (default webapp/sources).
- RESULTS: the group's final results table (agreed in the project brief). The docx ranking table is checked
  against it cell by cell, and the build fails on any difference.
- MODEL_DETAILS: settings and notes from each member's score report (IT24*.md), with the section cited.

Run:  python content/build_site_data.py      (also copies the file into web/src/data/)
"""
import html
import json
import os
import re
import shutil
import sys
import zipfile
from datetime import date
from pathlib import Path

HERE = Path(__file__).resolve().parent
WEBAPP = HERE.parent
SOURCES = Path(os.environ.get('DS15_SOURCES', WEBAPP / 'sources'))
DOCX = SOURCES / 'Model_Comparison_Summary.docx'
OUT = HERE / 'site_data.json'
WEB_COPY = WEBAPP / 'web' / 'src' / 'data' / 'site_data.json'

MEMBERS = {
    'IT24102928': {'name': 'Madushani G.R.', 'short': 'Madushani', 'models': ['logistic_regression', 'naive_bayes']},
    'IT24102255': {'name': 'Ranthisaru T.K.K.', 'short': 'Ranthisaru', 'models': ['knn', 'linear_svm']},
    'IT24102397': {'name': 'Ratnaweera D.U.A.', 'short': 'Ratnaweera', 'models': ['decision_tree', 'random_forest']},
    'IT24102901': {'name': 'Maheepala S.A.D.A.O.', 'short': 'Maheepala', 'models': ['adaboost', 'xgboost']},
}

# key, rank label, model, owner id, score, CV ROC, test ROC, test PR, test Brier (None = not reported)
RESULTS = [
    ('logistic_regression', '1', 'Logistic Regression', 'IT24102928', 88.8, 0.7743, 0.7793, 0.8593, 0.1735),
    ('adaboost', '2=', 'AdaBoost', 'IT24102901', 86.7, 0.7748, 0.7771, 0.8048, 0.1733),
    ('xgboost', '2=', 'XGBoost', 'IT24102901', 86.7, 0.7748, 0.7771, 0.8048, 0.1733),
    ('linear_svm', '4', 'Linear SVM', 'IT24102255', 86.6, 0.7742, 0.7793, 0.8599, 0.1736),
    ('knn', '5', 'KNN', 'IT24102255', 85.0, 0.7756, 0.7797, 0.8534, 0.1733),
    ('naive_bayes', '6', 'Naive Bayes', 'IT24102928', 58.9, 0.7693, 0.7791, 0.8593, 0.1763),
    ('decision_tree', '7', 'Decision Tree', 'IT24102397', 58.2, 0.7754, 0.7787, 0.8588, None),
    ('random_forest', '8', 'Random Forest', 'IT24102397', 40.8, 0.7736, 0.7787, 0.8601, None),
]
BASELINE = {'name': 'Simple shipping-mode rule', 'cv_roc': 0.7748, 'test_roc': 0.7771, 'test_brier': 0.1733,
            'cv_pr': 0.8018, 'cv_pr_ties_fair': 0.8562, 'test_pr': 0.8048,
            'how': "Predicted risk = the training late rate of the order's group: its shipping mode, and for Same Day "
                   'orders, whether it came in after 12:00. Five groups, no machine learning.'}
NO_SKILL = {'cv_pr': 0.5741, 'cv_roc': 0.5, 'brier': 0.2445}

# Values printed in docx Figure 3 (CV PR-AUC) and Figure 4 (train minus unseen PR-AUC).
CV_PR = {'logistic_regression': 0.8564, 'adaboost': 0.8018, 'xgboost': 0.8018, 'linear_svm': 0.8564, 'knn': 0.8517,
         'naive_bayes': 0.8540, 'decision_tree': 0.8555, 'random_forest': 0.8557}
FIT_GAP = {'logistic_regression': 0.0019, 'adaboost': -0.0025, 'xgboost': -0.0025, 'linear_svm': 0.0027, 'knn': 0.0,
           'naive_bayes': 0.0024, 'decision_tree': 0.0263, 'random_forest': 0.0310}
FIT_GAP_NOTE = 'Decision Tree and Random Forest use train minus test (no CV gap reported). Others use train minus CV.'

# Status shown on the model cards, from the docx ladder and reasons (sections 2 and 5).
STATUS = {
    'logistic_regression': {'kind': 'champion', 'flags': []},
    'adaboost': {'kind': 'evidence', 'flags': [{'level': 'warn', 'text': 'Test set seen twice (Part A, then Part B)'}]},
    'xgboost': {'kind': 'evidence', 'flags': [{'level': 'warn', 'text': 'Test set seen twice (Part A, then Part B)'}]},
    'linear_svm': {'kind': 'ok', 'flags': []},
    'knn': {'kind': 'ok', 'flags': []},
    'naive_bayes': {'kind': 'fail', 'flags': [{'level': 'fail', 'text': 'Fails ladder step 2: 0.0055 below the rule'}]},
    'decision_tree': {'kind': 'evidence', 'flags': [{'level': 'warn', 'text': 'Pipeline picked using test scores'},
                                                    {'level': 'warn', 'text': 'Brier score not reported'}]},
    'random_forest': {'kind': 'fail', 'flags': [{'level': 'fail', 'text': 'Fails ladder step 1: fit gap 0.0310'},
                                                {'level': 'warn', 'text': 'Test set used for choices'},
                                                {'level': 'warn', 'text': 'Brier score not reported'}]},
}

MODEL_DETAILS = {
    'logistic_regression': {
        'family': 'Linear model', 'source': 'IT24102928.md, sections 5.2 to 5.12',
        'how': 'Adds up a weight for each column, then turns the sum into a probability with the sigmoid curve. '
               'Each weight can be read as an odds ratio.',
        'settings': {'Pipeline': 'shared preprocessor v1.0, drop constant columns, keep top k columns (ANOVA F-test), LogisticRegression',
                     'Columns kept (k)': '20 of 54', 'C': '0.1', 'Penalty': 'L2', 'Class weight': 'none',
                     'Calibration': 'none (raw probabilities were already honest)', 'Cut-off': '0.6040'},
        'strengths': ['No weak cell on the scorecard and a clean protocol.',
                      'Easiest to explain: each weight is an odds ratio. Shipping mode and the Same Day after-noon flag do almost all the work.',
                      'Honest probabilities without any calibration (test Brier 0.1735).',
                      'No overfitting: train minus CV PR-AUC is +0.0019.'],
        'weaknesses': ['Only adds effects together, so it needs the same_day_after_cutoff flag to see the noon rule.',
                       "Does not beat the simple rule: CV ROC-AUC 0.7743 against the rule's 0.7748.",
                       'Its scores have only a few distinct values, so risk tiers mostly copy the shipping mode.'],
        'drivers': [{'feature': 'Same Day after 12:00', 'coef': 5.5161, 'odds_ratio': 248.67},
                    {'feature': 'First Class', 'coef': 4.3032, 'odds_ratio': 73.94},
                    {'feature': 'Second Class', 'coef': 0.5988, 'odds_ratio': 1.8199},
                    {'feature': 'Standard Class', 'coef': -1.1893, 'odds_ratio': 0.3044},
                    {'feature': 'Same Day', 'coef': -3.3487, 'odds_ratio': 0.0351}],
        'improve': ['Keep it as the explainable champion and report the odds ratios.',
                    'Only new information (warehouse workload, carrier, distance, weather) could lift the score.'],
    },
    'adaboost': {
        'family': 'Boosting', 'source': 'IT24102901.md, sections 4.1 to 4.10',
        'how': 'Builds small trees one after another. Each new tree focuses on the orders the earlier trees got wrong. '
               'The final score is a weighted vote.',
        'settings': {'Model': 'tuned AdaBoost, round 1 settings', 'Trees': '50', 'Tree depth': '2', 'Learning rate': '0.5',
                     'Columns': 'shipping_mode dummies and same_day_after_cutoff', 'Size': '150 leaves',
                     'Calibration': 'isotonic, fitted on out-of-fold scores'},
        'strengths': ['Best fit gap of the eight (-0.0025).', 'Matches the simple rule exactly on the test set.',
                      'Calibration cut the Brier score by 0.0186.'],
        'weaknesses': ['Adds nothing over a one-line rule, but is heavier.',
                       'Lower PR-AUC (0.8048) is a tie effect, not worse ranking.',
                       'The test set was seen twice (Part A, then Part B).'],
        'improve': ['Report it next to the simple rule, since the two give the same predictions.',
                    'State plainly that the test set was looked at before Part B.'],
    },
    'xgboost': {
        'family': 'Boosting', 'source': 'IT24102901.md, sections 5.1 to 5.12',
        'how': 'Builds trees one after another, each fitted to the remaining errors of the trees before it. Has built-in '
               'brakes: depth limits, minimum leaf weight, row sampling and L2 regularisation.',
        'settings': {'Model': 'tuned XGBoost, round 1 settings', 'Trees': '100', 'Tree depth': '2', 'Learning rate': '0.3',
                     'Min child weight': '20', 'Columns': 'shipping_mode dummies and same_day_after_cutoff',
                     'Size': '303 leaves in CV (305 on all training orders)', 'Calibration': 'not used'},
        'strengths': ['Fixed a badly overfitted baseline: the gap fell from +0.1097 to -0.0025.',
                      'Same final predictions as AdaBoost and the simple rule.', 'Fast: 0.05 s to score 13,071 orders.'],
        'weaknesses': ['Adds nothing over the simple rule.', 'Lower PR-AUC (0.8048) is a tie effect, not worse ranking.',
                       'The test set was seen twice (Part A, then Part B).'],
        'improve': ['Report it next to the simple rule.', 'State plainly that the test set was looked at before Part B.'],
    },
    'linear_svm': {
        'family': 'Margin-based linear model', 'source': 'IT24102255.md, sections 3.2, 6 and 8.2',
        'how': 'Draws the flat boundary that separates late from on-time orders with the widest margin. Its output is a '
               'distance from that boundary, which is then calibrated into a probability.',
        'settings': {'Pipeline': 'shared preprocessor v1.0, LinearSVC', 'Columns': 'all 54', 'C': '0.01', 'Penalty': 'L2',
                     'Class weight': 'balanced', 'Calibration': 'isotonic, learned on out-of-fold training scores',
                     'Threshold A': '0.5889'},
        'strengths': ['Strong numbers: test ROC-AUC 0.7793 and test PR-AUC 0.8599.', 'Very fast (0.03 s).', 'Healthy fit.'],
        'weaknesses': ['Needs a calibration step, because its raw output is not a probability.',
                       'Does not beat the simple rule.'],
        'improve': ['Keep the isotonic calibration and report it as part of the model.'],
    },
    'knn': {
        'family': 'Distance-based', 'source': 'IT24102255.md, sections 3.1, 6 and 8.1',
        'how': 'Finds the most similar past orders and uses the share of them that were late as the probability.',
        'settings': {'Pipeline': 'shared preprocessor v1.0, SelectKBest(f_classif, k=6), KNeighborsClassifier',
                     'Columns kept': '6 of 54', 'Neighbours (k)': '801', 'Weights': 'distance', 'Distance': 'p = 1 (city-block)',
                     'Training data': 'all 44,492 training orders', 'Calibration': 'none', 'Threshold A': '0.5999'},
        'strengths': ['Full marks on ranking power: the highest CV ROC-AUC (0.7756) and test ROC-AUC (0.7797).',
                      'No overfitting (gap 0.0000).'],
        'weaknesses': ['Slow: 9.6 s per 7,415 orders.', 'Stores all training data.',
                       'Its lead of 0.0008 over the rule is noise.'],
        'improve': ['Only worth it if raw ranking matters more than speed and simplicity.'],
    },
    'naive_bayes': {
        'family': 'Probabilistic', 'source': 'IT24102928.md, sections 6.1 to 6.12',
        'how': "Uses Bayes' rule and multiplies the evidence from every column, assuming the columns are independent "
               'once the class is known.',
        'settings': {'Variant': 'Gaussian NB', 'var_smoothing': '1e-6', 'Columns kept (k)': '12 of 54',
                     'Calibration': 'sigmoid (Platt)', 'Cut-off': '0.5656'},
        'strengths': ['Fast and simple.', 'No overfitting: the gap is +0.0024.'],
        'weaknesses': ['Fails ladder step 2: CV ROC-AUC 0.7693 is 0.0055 below the rule.',
                       'Poor raw probabilities: overlapping columns repeat the same evidence. Worst test Brier (0.1763).',
                       'Widest fold spread.'],
        'improve': ['Keep the sigmoid calibration: it cut the validation Brier score from 0.3875 to 0.1804.'],
    },
    'decision_tree': {
        'family': 'Trees', 'source': 'IT24102397.md, sections 3 and 6',
        'how': 'Splits orders again and again by the column that best separates late from on-time orders.',
        'settings': {'Feature step': 'SelectKBest(mutual_info_classif, k=15)', 'max_depth': 'None',
                     'min_samples_split': '50', 'min_samples_leaf': '50', 'class_weight': 'balanced',
                     'Tuning': 'grid search, 90 settings'},
        'strengths': ['Good ranking numbers: CV ROC-AUC 0.7754.',
                      'Tuning (at least 50 orders per leaf) cut the overfit gap from about 0.34 to about 0.03.'],
        'weaknesses': ['The pipeline was picked using test scores.', 'Brier score not reported.',
                       'Fit gap 0.0263, close to the 0.03 limit.', 'Did not use the shared CV folds.'],
        'improve': ['Rerun on the shared folds, choose on CV only, and score the test set once.',
                    'Use the same tuning budget as the other models.'],
    },
    'random_forest': {
        'family': 'Trees and bagging', 'source': 'IT24102397.md, sections 4 and 6',
        'how': 'Averages many decision trees, each grown on a different sample of the orders.',
        'settings': {'Columns': 'all 54', 'n_estimators': '200', 'max_depth': '10', 'min_samples_split': '50',
                     'min_samples_leaf': '50', 'class_weight': 'balanced', 'Tuning': 'grid search, 24 settings'},
        'strengths': ['Strong even untuned.', 'Highest test PR-AUC of the eight (0.8601).'],
        'weaknesses': ['Fails ladder step 1: fit gap 0.0310 is over the 0.03 limit.',
                       'Smallest grid (24) and every best setting sits at the edge of the range.',
                       'The test set was used for choices.', 'Brier score not reported.'],
        'improve': ['Rerun on the shared folds with a wider search, including max_features.',
                    'Choose on CV only and score the test set once.'],
    },
}

# Method tabs: each maps to one docx theory box (by title) plus the evidence that rule produced.
METHOD_TABS = [
    {'key': 'ladder', 'title': 'Decision ladder', 'theory': None},
    {'key': 'cv', 'title': 'Time-ordered CV', 'theory': 'why time-ordered cross-validation',
     'showed': ['All eight models were scored on the same five time-ordered folds, with a gap of 448 orders.',
                'Decision Tree and Random Forest used their own folds and the test set to choose, which lowers their evidence score.']},
    {'key': 'metrics', 'title': 'ROC-AUC vs PR-AUC and ties', 'theory': 'why we rank on ranking quality',
     'extra_theory': 'the tie zone and the data ceiling',
     'showed': ['AdaBoost and XGBoost score 0.8018 PR-AUC, but so does the rule when ties count against it. With ties broken fairly the rule scores 0.8562.',
                'All models sit inside a 0.006 band of CV ROC-AUC. Only Naive Bayes is outside the tie zone.']},
    {'key': 'brier', 'title': 'Brier and calibration', 'theory': 'overfitting, Brier score and calibration',
     'showed': ['Five models land within 0.0003 of the rule\'s Brier score of 0.1733. Naive Bayes is worse at 0.1763.',
                'Decision Tree and Random Forest did not report Brier.']},
    {'key': 'scorecard', 'title': 'The scorecard', 'theory': 'what each scorecard column measures', 'showed_from': 'rank_reasons'},
    {'key': 'sensitivity', 'title': 'Sensitivity test', 'theory': 'sensitivity analysis', 'showed_from': 'sensitivity_text'},
]

FORMULAS = {
    'cv': 'for fold in 1..5:\n    fit on orders before the fold\n    skip 448 orders (about 7 days)\n    score the next 7,415 orders\nCV score = mean of the 5 fold scores',
    'metrics': 'ROC-AUC = P(score of a random late order > score of a random on-time order)\nPR-AUC  = area under precision vs recall (late class)\nno skill: ROC-AUC 0.5, PR-AUC = late rate (0.574)',
    'brier': 'Brier = mean( (p - y)^2 )      y = 1 if late, 0 if on time\nperfect = 0, no skill = 0.2445, lower is better',
    'scorecard': 'total = ranking power (25) + fit health (15) + probability honesty (15)\n      + fold stability (10) + simplicity and speed (20) + evidence quality (15)',
    'sensitivity': 'repeat 4,000 times:\n    draw six random weights (every mix equally likely)\n    re-rank the eight models\ncount how often each model reaches each place',
    'ladder': 'step 1  fit check     out if train PR-AUC - unseen PR-AUC > 0.03\nstep 2  rule check    out if CV ROC-AUC < 0.7748 - 0.005\nstep 3  head-to-head  out only if worse on BOTH ROC and PR by > 0.005\nstep 4  tie-break     scorecard: simplicity, stability, honesty, evidence',
}

DATA_LIMITS = [
    {'title': 'A ceiling of about 0.775 ROC-AUC', 'body': 'Lateness is almost fully set by the shipping mode and the Same Day noon cut-off. A simple rule already captures that, so eight different algorithms land on the same score.'},
    {'title': 'Inside two shipping modes it is a coin flip', 'body': 'About 40% of Standard Class and 80% of Second Class orders are late, and nothing known at order time says which ones. Within-group ROC-AUC is about 0.50.'},
    {'title': 'Only order-time information', 'body': 'The models never see real shipping days, warehouse workload, carrier, distance or weather. Only new information like that could raise the ceiling.'},
    {'title': 'The served champion is a local retrain', 'body': "Madushani's original model file was not provided, so this app retrains Logistic Regression from her reported settings on pipeline v1.0 rebuilt from dataset.zip. Every reported number and coefficient was reproduced exactly."},
    {'title': 'Seven models are documentation only', 'body': "Their saved files were not provided, so Predict uses only the champion. Their numbers come from the group's results table."},
]


def _text(xml):
    return html.unescape(''.join(re.findall(r'<w:t[^>]*>([^<]*)</w:t>', xml)))


def _paras(xml):
    return [t for t in (_text(p) for p in re.findall(r'<w:p[ >].*?</w:p>', xml, re.S)) if t.strip()]


def read_docx(path):
    xml = zipfile.ZipFile(path).read('word/document.xml').decode()
    body = xml[xml.find('<w:body>'):]
    blocks = []
    for item in re.findall(r'(<w:p[ >].*?</w:p>|<w:tbl>.*?</w:tbl>)', body, re.S):
        if item.startswith('<w:tbl>'):
            rows = [[_paras(c) for c in re.findall(r'<w:tc>.*?</w:tc>', r, re.S)]
                    for r in re.findall(r'<w:tr[ >].*?</w:tr>', item, re.S)]
            blocks.append({'kind': 'table', 'rows': rows})
        else:
            t = _text(item)
            if t.strip():
                style = re.search(r'<w:pStyle w:val="([^"]+)"', item)
                blocks.append({'kind': 'p', 'style': style.group(1) if style else '', 'text': t})
    return blocks


def section(blocks, heading):
    start = next(i for i, b in enumerate(blocks) if b['kind'] == 'p' and b['style'] == 'Heading2' and b['text'].startswith(heading))
    out = []
    for b in blocks[start + 1:]:
        if b['kind'] == 'p' and b['style'] == 'Heading2':
            break
        out.append(b)
    return out


def callouts(blocks):
    out = []
    for b in blocks:
        if b['kind'] == 'table' and len(b['rows']) == 1 and len(b['rows'][0]) == 1:
            paras = b['rows'][0][0]
            out.append({'label': 'Theory', 'title': paras[0].removeprefix('Theory: '), 'body': paras[1:]})
    return out


def paragraphs(blocks, style=None):
    return [b['text'] for b in blocks if b['kind'] == 'p' and (style is None or b['style'] == style)]


def main():
    blocks = read_docx(DOCX)
    errors = []

    table = next(b['rows'] for b in blocks if b['kind'] == 'table' and b['rows'][0][0] == ['Rank'])
    reasons = {}
    for (key, rank, model, owner, score, cv_roc, test_roc, *_), row in zip(RESULTS, table[1:]):
        cells = [' '.join(c) for c in row]
        expected = [rank, model, f"{MEMBERS[owner]['short']} {owner}", f'{score:.1f}', f'{cv_roc:.4f}', f'{test_roc:.4f}']
        if cells[:6] != expected:
            errors.append(f'docx ranking row differs for {model}: {cells[:6]} != {expected}')
        reasons[key] = cells[6]
    if len(table) - 1 != len(RESULTS):
        errors.append(f'docx ranking table has {len(table) - 1} rows, expected {len(RESULTS)}')

    ladder_rows = next(b['rows'] for b in blocks if b['kind'] == 'table' and b['rows'][0][0] == ['Step'])
    ladder = []
    for row in ladder_rows[1:]:
        n, name = ' '.join(row[0]).split(' ', 1)
        ladder.append({'step': int(n), 'name': name, 'why': ' '.join(row[1]), 'how': ' '.join(row[2]), 'showed': ' '.join(row[3])})
    ladder_marks = {1: {'out': ['random_forest']}, 2: {'out': ['naive_bayes']}, 3: {'out': []}, 4: {'out': []}}
    for s in ladder:
        s['out'] = ladder_marks[s['step']]['out']

    s1, s2, s3 = section(blocks, '1.'), section(blocks, '2.'), section(blocks, '3.')
    s4, s5, s6 = section(blocks, '4.'), section(blocks, '5.'), section(blocks, '6.')
    s7, s8 = section(blocks, '7.'), section(blocks, '8.')
    theory = callouts(s2) + callouts(s3) + callouts(s4) + callouts(s5) + callouts(s6)
    by_title = {t['title']: t for t in theory}
    for needle in ['Random Forest 0.0310 is out', 'Naive Bayes (0.7693) is 0.0055 below']:
        if not any(needle in r['showed'] for r in ladder):
            errors.append(f'ladder text missing: {needle}')

    models = []
    for i, (key, rank, model, owner, score, cv_roc, test_roc, test_pr, brier) in enumerate(RESULTS):
        models.append({'key': key, 'rank': rank, 'rank_order': i + 1, 'name': model, 'owner_id': owner,
                       'owner_name': MEMBERS[owner]['name'], 'owner_short': MEMBERS[owner]['short'],
                       'label': f"{model} ({MEMBERS[owner]['short']} {owner})", 'score': score, 'cv_roc': cv_roc,
                       'test_roc': test_roc, 'test_pr': test_pr, 'test_brier': brier, 'cv_pr': CV_PR[key],
                       'fit_gap': FIT_GAP[key], 'main_reason': reasons[key], 'champion': key == 'logistic_regression',
                       'status': STATUS[key], 'served': key == 'logistic_regression', **MODEL_DETAILS[key]})

    rank_reasons = paragraphs(s5, 'ListParagraph')
    sensitivity_text = [p for p in paragraphs(s6, '') if not p.startswith('Figure')]
    method = []
    for tab in METHOD_TABS:
        t = dict(tab)
        if tab['theory']:
            t['why'] = by_title[tab['theory']]['body']
            t['why_title'] = by_title[tab['theory']]['title']
            if tab.get('extra_theory'):
                t['why'] = t['why'] + by_title[tab['extra_theory']]['body']
        if tab.get('showed_from') == 'rank_reasons':
            t['showed'] = rank_reasons
        if tab.get('showed_from') == 'sensitivity_text':
            t['showed'] = sensitivity_text
        t['formula'] = FORMULAS[tab['key']]
        method.append(t)

    data = {
        'meta': {'title': 'Late delivery risk on the DataCo supply chain dataset', 'group': '2026-DS-15',
                 'module': 'IT3091 Machine Learning', 'built': date.today().isoformat(),
                 'sources': ['Model_Comparison_Summary.docx', 'IT24102928.md', 'IT24102255.md', 'IT24102397.md',
                             'IT24102901.md', 'IT3091_2026-DS-15_Initial_Submission.pdf']},
        'members': [{'id': k, **v} for k, v in MEMBERS.items()],
        'facts': {'target': 'Late_delivery_risk (1 = late, 0 = on time)', 'late_rate': 0.573,
                  'splits': {'train': 44492, 'validation': 4564, 'test': 13071},
                  'split_dates': {'train': '2015-01-01 to 2017-03-24', 'validation': '2017-04-01 to 2017-06-23',
                                  'test': '2017-07-01 to 2018-01-31'},
                  'cv': {'folds': 5, 'gap_orders': 448, 'scheme': 'time-ordered, expanding window'},
                  'orders_total': 62897, 'input_features': 20, 'model_columns': 54, 'ceiling_roc': 0.775,
                  'tie_zone': 0.005, 'fit_limit': 0.03, 'champion_cutoff': 0.6040, 'tiers': {'Medium': 0.60, 'High': 0.90}},
        'baseline': BASELINE, 'no_skill': NO_SKILL, 'models': models,
        'headline': paragraphs(s1)[0], 'glance_notes': paragraphs(s1, 'ListParagraph'),
        'how_we_ranked': paragraphs(s2, '')[0],
        'scorecard_weights': {'Ranking power': 25, 'Fit health': 15, 'Probability honesty': 15, 'Fold stability': 10,
                              'Simplicity and speed': 20, 'Evidence quality': 15},
        'theory': theory, 'ladder': ladder, 'method': method,
        'ranking_power_text': [p for p in paragraphs(s3, '') if not p.startswith('Figure')],
        'fit_text': [p for p in paragraphs(s4, '') if not p.startswith('Figure')],
        'fit_gap_note': FIT_GAP_NOTE, 'rank_reasons': rank_reasons, 'sensitivity_text': sensitivity_text,
        'fixes': paragraphs(s7, 'ListParagraph'), 'report_wording': paragraphs(s8, '')[0], 'data_limits': DATA_LIMITS,
        'figures': {
            'scorecard_heatmap': {'src': '/figures/scorecard-heatmap.png', 'caption': 'Figure 6. Scorecard heatmap. Green = full marks, red = none.',
                                  'source': 'Model_Comparison_Summary.docx, Figure 6',
                                  'alt': 'Scorecard heatmap. Totals out of 100: Logistic Regression 88.8, AdaBoost 86.7, XGBoost 86.7, Linear SVM 86.6, KNN 85.0, Naive Bayes 58.9, Decision Tree 58.2, Random Forest 40.8. Columns: ranking power /25, fit health /15, probability honesty /15, fold stability /10, simplicity and speed /20, evidence quality /15.'},
            'rank_robustness': {'src': '/figures/rank-robustness.png',
                                'caption': 'Figure 7. How often each model reaches each place when the weights change at random.',
                                'source': 'Model_Comparison_Summary.docx, Figure 7',
                                'alt': 'Heatmap of the rank each model reaches over 4,000 random weight sets. Logistic Regression and KNN each finish first in 44% of tests. Places 1 to 5 swap often; Random Forest finishes last in 88%.'},
        },
        'cite': 'Madushani G.R. (IT24102928), Ranthisaru T.K.K. (IT24102255), Ratnaweera D.U.A. (IT24102397) and '
                'Maheepala S.A.D.A.O. (IT24102901). 2026. Late delivery risk on the DataCo supply chain dataset. '
                'IT3091 Machine Learning, Group 2026-DS-15, Sri Lanka Institute of Information Technology.',
        'dataset': {'name': 'DataCo SMART SUPPLY CHAIN FOR BIG DATA ANALYSIS', 'source': 'Mendeley Data, version 4',
                    'authors': 'Fabian Constante, Fernando Silva and António Pereira', 'published': '2019-03-12',
                    'doi': '10.17632/8gx2fvg2k6.4', 'licence': 'CC BY 4.0',
                    'cite': 'Constante, F., Silva, F. and Pereira, A. (2019). DataCo SMART SUPPLY CHAIN FOR BIG DATA ANALYSIS. Mendeley Data, V4. https://doi.org/10.17632/8gx2fvg2k6.4',
                    'url': 'https://data.mendeley.com/datasets/8gx2fvg2k6/4',
                    'sha256': 'fa6d022ed437155e1a2f0378710602848703c8a7f203f7ff5d77805bf8480aa6'},
    }

    blob = json.dumps(data, ensure_ascii=False)
    for dash in ('—', '–'):
        if dash in blob:
            errors.append(f'dash character {dash!r} found in site data')
    if errors:
        print('FAILED:\n  ' + '\n  '.join(errors))
        sys.exit(1)
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
    WEB_COPY.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(OUT, WEB_COPY)
    print(f'Wrote {OUT} and {WEB_COPY}: {len(models)} models, {len(theory)} theory boxes, {len(method)} method tabs. '
          'Docx ranking table matches the results table.')


if __name__ == '__main__':
    main()
